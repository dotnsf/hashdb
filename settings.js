exports.basic_username = 'username';
exports.basic_password = 'password';
exports.cloudant_username = '(Cloudant Username)';
exports.cloudant_password = '(Cloudant Password)';
exports.cloudant_db = 'hashdb';

if( process.env.VCAP_SERVICES ){
  var VCAP_SERVICES = JSON.parse( process.env.VCAP_SERVICES );
  if( VCAP_SERVICES && VCAP_SERVICES.cloudantNoSQLDB ){
    exports.cloudant_username = VCAP_SERVICES.cloudantNoSQLDB.credentials.username;
    exports.cloudant_password = VCAP_SERVICES.cloudantNoSQLDB.credentials.password;
  }
}

