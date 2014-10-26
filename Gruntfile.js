/*global module:false*/
module.exports = function(grunt) {
  var fs = require("fs"),
      config;

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    prompt: {
        configure: {
            options: {
                questions: [
                    {
                        config: "virtualenv",
                        type: "input",
                        message: "Path to virtualenv?",
                        default: "/usr/bin/virtualenv"
                    },

                    {
                        config: "python",
                        type: "input",
                        message: "Path to python?",
                        default: "/usr/bin/python"
                    }
                ]
            }
        }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'nodeunit']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-prompt");
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Read configuration from disk.
  grunt.registerTask("readconfig", "Read configuration options from disk", function () {
      var text;

      try {
          text = fs.readFileSync("configuration.json");
          config = JSON.parse(text);
      } catch (e) {
          grunt.task.run("configure");
          return;
      }
  });

  // Configuration task.
  grunt.registerTask("configure", "Write configuration options to disk", function () {
    var text;

    // If there is no config file already, then schedule the appropriate prompt
    // task, followed by a retry of the current task, then bail.
    if (!grunt.config("virtualenv")) {
        grunt.task.run("prompt:configure");
        grunt.task.run("configure");
        return;
    }

    // Build a configuration object from the config values.
    text = JSON.stringify({
        virtualenv: grunt.config("virtualenv"),
        python: grunt.config("python")
    }, null, 4) + "\n";

    // Serialize to disk.
    try {
        fs.writeFileSync("configuration.json", text);
    } catch (e) {
        grunt.fail.warn("Could not write configuration.json" + e);
    }
  });

  // Virtualenv installation task.
  grunt.registerTask("virtualenv", "Create a virtual python environment", function () {
      var done;

      if (!config) {
          grunt.fail.warn("Task depends on 'readconfig' task");
      }

      try {
          fs.statSync("venv");
          console.log("Virtual environment already exists");
          return;
      } catch (e) {
          console.log("Creating virtual environment");

          done = this.async();

          grunt.util.spawn({
              cmd: config.virtualenv,
              args: ["-p", config.python, "venv"]
          }, function (error, result, code) {
              if (error) {
                  grunt.fail.warn("Could not initialize virtualenv:\n" + result.stderr);
              }

              done();
          });
      }
  });

  // Default task.
  grunt.registerTask('default', ['readconfig', 'virtualenv']);

};
