var swfu;

var RD.FileUploader = {
	uploaders: [],
	
  create: function(options, handler) {
		var instance;
		handler = handler || RD.AlbumUpload;
		instance = Object.create(this.instance);
		instance.options = $.extend({}, this.defaultOptions, options, this.makeHandlers(instance));
    instance.swfu = new SWFUpload(instance.options);
  },

	instancePrototype: {		
	  swfUploadReady: function() {
	    debug("SWFUpload ready.");
	  },

	  fileQueued: function(file) {
	  	debug("File queued!");
	  	// create the image and initialize it from the upload
	  	new RD.AlbumUpload().initFromUpload(file);

	  	// add the file type to the upload
	      swfu.addFileParam(file.id, 'Filetype', file.type);
	      debug("File type is " + file.type);
	  }

	  fileQueueError: function(file, errorCode, message) {
	  	debug("File queue error!");
	  	if (errorCode === SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED) {
	  		alert("You have attempted to queue too many files.\n" + (message === 0 ? "You have reached the upload limit." : "You may select " + (message > 1 ? "up to " + message + " files." : "one file.")));
	  		return;
	    }

	  	errorText = "";
	  	// most queue errors are unrecoverable
	  	isRecoverable = false;

	  	switch (errorCode) {
	  	case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
	  		errorText = "File too big";
	  		this.debug("Error Code: File too big, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
	  		errorText = "Empty file";
	  		this.debug("Error Code: Zero byte file, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE:
	  		errorText = "Invalid type";
	  		this.debug("Error Code: Invalid File Type, File name: " + file.name + ", File type: " + file.type + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	default:
	  		if (file !== null) {
	  		}
	  		errorText = "Other error";
	  		this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	}
	  	mi = RD.AlbumUpload.findByFileObject(file);
	  	if (mi) {
	  	    debug("In fileDialogError, setting uploadError.");
	  	    mi.uploadErrored({
	  	        isRecoverable: isRecoverable,
	  	        shortDescription: errorText
	  	    })
	  	}
	  }

	  fileDialogComplete: function(numFilesSelected, numFilesQueued, totalQueued) {
	      // we don't need to do anything specific here -- everything is handled in the fileQueued event
	  	debug("File dialog complete, starting upload.");
	  	this.startUpload();
	  }

	  uploadStart: function(file) {
	      // tell the file it's uploading
	  	debug("uploadStart called");
	      mi = RD.AlbumUpload.findByFileObject(file);
	      if (mi) {
	          mi.uploadStarted();
	          return true;
	      }
	      else
	          debug("Unable to find meal image " + file.name);
	  }

	  uploadProgress: function(file, bytesLoaded, bytesTotal) {
	      // update the progress
	      debug("Upload progress! " + bytesLoaded + " / " + bytesTotal);
	  	var percent = bytesLoaded / bytesTotal;
	      mi = RD.AlbumUpload.findByFileObject(file);
	      if (mi) {
	          mi.uploadProgressed(percent);
	          return true;
	      }
	  }

	  uploadSuccess: function(file, serverData) {
	  	debug("Upload success!  Server responded: " + (serverData.toSource ? serverData.toSource() : serverData));

	      mi = RD.AlbumUpload.findByFileObject(file);
	      if (mi) {
	          // parse the server data
	      	results = null;
	          try {
	      		if (typeof(JSON) != "undefined" && typeof(JSON.parse) == "function"){
	      	        // try to parse the quicker and safer way
	      	        results = JSON.parse(serverData);
	      	    }
	      	    else {
	      	        // use eval
	      	        debug("Parsing using eval :(");
	      	        results = eval(serverData);
	      			if (typeof(results) != "object") {
	      				debug("Server response did not parse to JSON!");
	                      results = null;
	  				}
	          	}
	      	}
	          catch(e) {
	      		// if we have an error, hand off to the bad server content department
	      		results = null;
	      	}

	          mi.uploadCompleted(results);
	          return true;
	      }
	  }

	  uploadError: function(file, errorCode, message) {
	  	debug("Upload error!");

	  	errorText = "Upload Error";
	  	isRecoverable = true;

	  	switch (errorCode) {
	  	case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
	  		this.debug("Error Code: HTTP Error, File name: " + file.name + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.UPLOAD_FAILED:
	  		this.debug("Error Code: Upload Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.IO_ERROR:
	  		this.debug("Error Code: IO Error, File name: " + file.name + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.SECURITY_ERROR:
	          isRecoverable = false;
	  		this.debug("Error Code: Security Error, File name: " + file.name + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
	          isRecoverable = false;
	  		this.debug("Error Code: Upload Limit Exceeded, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED:
	          isRecoverable = false;
	  		this.debug("Error Code: File Validation Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
	  	    // if we have additional images to upload, upload them
	  	    if (RD.AlbumUpload.doUnfinishedUploadsExist()){
	              debug("File was canceled, starting any additional uploads.");
	              swfu.startUpload();
	          }
	          isRecoverable = false;
	  		break;
	  	case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
	  		isRecoverable = false;
	  		break;
	  	default:
	          isRecoverable = true;
	  		this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
	  		break;
	  	}

	  	mi = RD.AlbumUpload.findByFileObject(file);
	  	if (mi) {
	  	    // let it know it errored
	  	    debug("In uploadError, setting uploadError.");

	  	    mi.uploadErrored({
	  	        shortDescription: errorText,
	  	        isRecoverable: isRecoverable,
	  	    })

	  	    // if it says it's done, cancel it
	  	    if (mi.shouldCancelUpload())
	  	        this.cancelUpload(mi.fileObject.id);
	  	}
	  }

	  uploadComplete: function(file) {
	  	debug("File upload complete for " + file.name);

	      // make sure uploadComplete was fired
	  	mi = RD.AlbumUpload.findByFileObject(file);
	      if (mi && mi.isUploading()) {
	          // we have a problem here
	          throw("Problem!  RD.AlbumUpload hit uploadComplete without UploadSuccess!")
	      }

	  	if (swfu.getStats().files_queued === 0) {
	  		debug("All files uploaded!");
	  	}

	  	return true;
	  }

	  // This event comes from the Queue Plugin
	  queueComplete: function(numFilesUploaded) {
	  	debug("Queue completion happening!");
	  }
	
};

// defined separately because it points to functions defined in the main definition
// which aren't resolved until the hash is closed
RD.FileUploader.defaultOptions = { 
	// file types
	file_types: "*.jpg; *.jpeg; *.png; *.gif",
	file_types_description: "JPG, GIF, and PNG files only.",

	// button settings
	button_placeholder_id: "uploadButton",
	button_cursor: SWFUpload.CURSOR.HAND,

	// requeue on error
	requeue_on_error: true
};