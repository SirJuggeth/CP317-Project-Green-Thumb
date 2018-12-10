
/**@abstract
 * 
 * @author Ben Keunen
 * @author Joseph Myc
 * 
 * @description This class is designed to Identify a given image,
 * and return the results as an array of detections
 * 
 */
const { spawn } = require('child_process');
const MODEL_URL = 'model';
const TRAIN_CONFIG = 'training/ssd_mobilenet_v1_coco_2017_11_17.config';
class TFTrainer {

    /**
     * @author Joseph Myc
     * 
     * Saves the trained model to a frozen inference graph
     */
    static saveModel() {
        /**
         * @param {Buffer} data
         * function used to search for highest index files given data from ls command
         */
        let check = function (data) {

            let regexVar = /model.ckpt-[0-9]*\.meta/g;
            //sets data to a string
            let ret = String(data);
            //searches for line matching 'model.ckpt-[0-9]*\.meta' in data
            let found = ret.match(regexVar);
            //changes regex to just search for the number within the string
            regexVar = /\d+/;

            //searches for the highest number within the original list of lines matching 'model.ckpt-[0-9]*\.meta'
            let max = 0;
            for (let i = 0; i < found.length; i++) {
                let num = parseInt(found[i].match(regexVar));
                if (num > max) {
                    max = num;
                }
            }
            // $ arguments represents arguments which should not be changed
        //arguments are [$script, $input type, path to configuration file of the model, prefix of latest checkpoint file given by training, where to save the frozen graph]
        const exportFile = spawn('python', ["object_detection/export_inference_graph.py", "--input_type=image_tensor", "--pipeline_config_path=" + TRAIN_CONFIG,
        "--trained_checkpoint_prefix=training/model.ckpt-" + String(max), "--output_directory=" + MODEL_URL]);
            
        }

        //performs ls command from training directory
        const findCheck = spawn('ls', {cwd: "training"});
        findCheck.stdout.on('data', check);


    }

    /**
     * @author Ben Keunen
     * 
     * Node.js script that trains a model for a given number of hours
     * must be run from Object_Detection directory
     *
     * Requires Train.TFrecord and Test.TFrecord within object_detection folder and labelmap.pbtxt in object_detection/training folder
     *
     * @param time (float) hours to train or null/0 if default time of 8 hours is to be used
     * @param model (String) model to be trained ie 'ssd_mobilenet_v1_coco_2017_11_17'
     */
    static trainModel(time, model) {

        //arguments are [where to log errors, directory of where training occurs, path to configuration file of the model]
        const train = spawn('python',
            ["object_detection/legacy/train.py", "--logtostderr", "--train_dir=training/", "--pipeline_config_path=training/" + model]);

        //sets a timer to allow the training to occur for 'time' hours as input as an argument
        if (time){
        setTimeout((evt) => {
            //stops the training after time has passed
            train.kill();
            //calls function to find highest checkpoint and export a graph based upon it
            TFTrainer.saveModel(model);
            //60 minutes * 'time' hours
        }, 1000 * 60 * 60 * time);   
        }
        
        //if no time parameter passed use default time of 8 hours.
        else{
            setTimeout((evt) => {
            //stops the training after time has passed
            train.kill();
            //calls function to find highest checkpoint and export a graph based upon it
            TFTrainer.saveModel(model);
            //8 hours
        }, 1000 * 60 * 60 * 8);
        }
    }
}
