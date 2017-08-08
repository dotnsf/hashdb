# hashdb

## Install & Setup

- Get access(Sign-in) to [IBM Bluemix](http://bluemix.net/)

- Install cf command line tool for your system.

    - https://github.com/cloudfoundry/cli/releases

- Login to IBM Bluemix, and Create Node.js Runtime.

- Create Cloudant NoSQL Database service. 

    - And bind it to Node.js Runtime. (optional)

- Clone or Download this repository

    - $ git clone https://github.com/dotnsf/hashdb

- Edit settings.js for Basic Authentication

    - If you already bind Cloudant to Node.js, you don't need to care about Cloudant username and password. IBM Bluemix will take care of it.

    - If you don't bind Cloudant to Node.js, or if you would use non-Bluemix environment for Node.js, you need to input Cloudant username and password in settings.js too.

- Deploy your application to Node.js Runtime.

    - $ cf push APPNAME

## Licensing

This code is licensed under MIT.

## Copyright

2017 Y.Shiotani @ Juge.Me, K.Kimura @ Juge.Me all rights reserved.


