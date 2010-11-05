RD.UploadManager = {
	uploaders: [],
	
  create: function(options, handler) {
		var instance;
		
		instance = Object.create(this.instancePrototype);
		instance.options = $.extend({}, this.defaultOptions, options, instance.getHandlers());
    	instance.swfu = new SWFUpload(instance.options);
		instance.handler = handler;
		
		this.uploaders.push(instance);
		
		return instance;
  },

	defaultOptions: { 
		// file types
		file_types: "*.jpg; *.jpeg; *.png; *.gif",
		file_types_description: "JPG, GIF, and PNG files only.",

		// button settings
		button_placeholder_id: "uploadButton",
		button_cursor: SWFUpload.CURSOR.HAND,

		// requeue on error
		requeue_on_error: true
	},

	instancePrototype: {		
	  getHandlers: function() {
			var result, handlers = {
				swfupload_loaded_handler: "swfUploadReady",
				file_queued_handler: "fileQueued",
				file_queue_error_handler: "fileQueueError", 
				file_dialog_complete_handler: "fileDialogComplete",
				upload_start_handler: "uploadStart",
				upload_progress_handler: "uploadProgress",
				upload_error_handler: "uploadError",
				upload_success_handler: "uploadSuccess",
				upload_complete_handler: "uploadComplete",
				queue_complete_handler: "queueComplete"
			};
			
			// make sure the callbacks retain the FileUpload object as this
			for (var i in handlers) {
				handlers[i] = $.proxy(this[handlers[i]], this);
			}
			handlers.debug_handler = RD.debug;

			return handlers;
		},
	
		swfUploadReady: function() {
	    RD.debug("SWFUpload ready.");
	  },

	  fileQueued: function(file) {
	  	RD.debug("File queued!");
	  	// create the image and initialize it from the upload
	  	this.handler.newUploadObject().initFromUpload(file);

	  	// add the file type to the upload
		// this == SWFU object, not the FileUpload object
		this.swfu.addFileParam(file.id, 'Filetype', file.type);
	    RD.debug("File type is " + file.type);
	  },

	  fileQueueError: function(file, errorCode, message) {
	  	RD.debug("File queue error!");
	  	if (errorCode === SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED) {
	  		alert("You have attempted to queue too many files.\n" + (message === 0 ? "You have reached the upload limit." : "You may select " + (message > 1 ? "up to " + message + " files." : "one file.")));
	  		return;
	    }

	  	var errorText = "";
	  	// most queue errors are unrecoverable
	  	var isRecoverable = false;

	  	switch (errorCode) {
	  	case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
	  		errorText = "File too big";
	  		RD.debug("Error Code: File too big, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
	  		errorText = "Empty file";
	  		RD.debug("Error Code: Zero byte file, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE:
	  		errorText = "Invalid type";
	  		RD.debug("Error Code: Invalid File Type, File name: " + file.name + ", File type: " + file.type + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	default:
	  		if (file !== null) {
	  		}
	  		errorText = "Other error";
	  		RD.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	}
	  	var upload = this.handler.findByFileObject(file);
	  	if (upload) {
	  	    RD.debug("In fileDialogError, setting uploadError.");
	  	    upload.uploadErrored({
	  	        isRecoverable: isRecoverable,
	  	        shortDescription: errorText
	  	    })
	  	}
	  },

	  fileDialogComplete: function(numFilesSelected, numFilesQueued, totalQueued) {
	      // we don't need to do anything specific here -- everything is handled in the fileQueued event
	  	RD.debug("File dialog complete, starting upload.");
			// this == SWFU object, not the FileUpload object
	  	this.swfu.startUpload();
	  },

	  uploadStart: function(file) {
	      // tell the file it's uploading
	  	RD.debug("uploadStart called");
	      var upload = this.handler.findByFileObject(file);
	      if (upload) {
	          upload.uploadStarted();
	          return true;
	      }
	      else
	          RD.debug("Unable to find meal image " + file.name);
	  },

	  uploadProgress: function(file, bytesLoaded, bytesTotal) {
	      // update the progress
	      RD.debug("Upload progress! " + bytesLoaded + " / " + bytesTotal);
	  	var percent = bytesLoaded / bytesTotal;
	      var upload = this.handler.findByFileObject(file);
	      if (upload) {
	          upload.uploadProgressed(percent);
	          return true;
	      }
	  },

	  uploadSuccess: function(file, serverData) {
	  	RD.debug("Upload success!  Server responded: " + (serverData.toSource ? serverData.toSource() : serverData));

	      var upload = this.handler.findByFileObject(file);
	      if (upload) {
	          // parse the server data
	      	results = null;
	          try {
	      		if (typeof(JSON) != "undefined" && typeof(JSON.parse) == "function"){
	      	        // try to parse the quicker and safer way
	      	        results = JSON.parse(serverData);
	      	    }
	      	    else {
	      	        // use eval
	      	        RD.debug("Parsing using eval :(");
	      	        results = eval(serverData);
	      					if (typeof(results) != "object") {
	      						RD.debug("Server response did not parse to JSON!");
	                  results = null;
	  							}
	          	}
	      	}
	          catch(e) {
	      		// if we have an error, hand off to the bad server content department
	      		results = null;
	      	}

	          upload.uploadCompleted(results);
	          return true;
	      }
	  },

	  uploadError: function(file, errorCode, message) {
	  	RD.debug("Upload error!");

	  	var errorText = "Upload Error", isRecoverable = true;

	  	switch (errorCode) {
	  	case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
	  		RD.debug("Error Code: HTTP Error, File name: " + file.name + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.UPLOAD_FAILED:
	  		RD.debug("Error Code: Upload Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.IO_ERROR:
	  		RD.debug("Error Code: IO Error, File name: " + file.name + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.SECURITY_ERROR:
	          isRecoverable = false;
	  		RD.debug("Error Code: Security Error, File name: " + file.name + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
	          isRecoverable = false;
	  		RD.debug("Error Code: Upload Limit Exceeded, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED:
	          isRecoverable = false;
	  		RD.debug("Error Code: File Validation Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
	  	    // if we have additional images to upload, upload them
	  	    if (this.handler.doUnfinishedUploadsExist()){
	              RD.debug("File was canceled, starting any additional uploads.");
	              // this == SWFU object, not the FileUpload object
								this.swfu.startUpload();
	          }
	          isRecoverable = false;
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
	  		isRecoverable = false;
	  		break;
	  	default:
	      isRecoverable = true;
	  		RD.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	}

	  	var upload = this.handler.findByFileObject(file);
	  	if (upload) {
	  	    // let it know it errored
	  	    RD.debug("In uploadError, setting uploadError.");

	  	    upload.uploadErrored({
	  	        shortDescription: errorText,
	  	        isRecoverable: isRecoverable,
	  	    })

	  	    // if it says it's done, cancel it
	  	    if (upload.shouldCancelUpload())
	  	        this.swfu.cancelUpload(upload.fileObject.id);
	  	}
	  },

	  uploadComplete: function(file) {
	  	RD.debug("File upload complete for " + file.name);

	      // make sure uploadComplete was fired
	  	var upload = this.handler.findByFileObject(file);
	      if (upload && upload.isUploading()) {
	          // we have a problem here
	          throw("Problem!  this.handler hit uploadComplete without UploadSuccess!")
	      }

	  	if (this.swfu.getStats().files_queued === 0) {
	  		RD.debug("All files uploaded!");
	  	}

	  	return true;
	  },

	  // This event comes from the Queue Plugin
	  queueComplete: function(numFilesUploaded) {
	  	RD.debug("Queue completion happening!");
	  }
	}
};