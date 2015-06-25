#Electron Starter

##Opinionated Starter app to build electron apps using the angular and/or the Ionic Framework


Includes Sketch Template for Mac Icon
- Customize Icon
- Export Icon as PNG
- use https://iconverticons.com/online/ to convert to ICNS
- Change Package Script to use the new icon


##Scripts


<-----CODE SIGNING SCRIPTS------>

codesign --deep --force --verbose --sign 9KR3C928N5 OnGolf.app --timestamp=none

codesign --verify -vvvv OnGolf.app
