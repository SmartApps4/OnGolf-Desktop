module.exports = function(grunt) {

  grunt.initConfig({
  	
   'create-windows-installer': {
  		appDirectory: './win/OnGolf-win32',
  		outputDirectory: './win/installer',
  		authors: 'Smartapps4',
  		exe: 'OnGolf.exe'
}
  });

 grunt.loadNpmTasks('grunt-electron-installer')

grunt.registerTask('default', ['grunt-electron-installer']);

};