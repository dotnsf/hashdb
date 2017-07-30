//.  app.js
var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    cfenv = require( 'cfenv' ),
    crypto = require( 'crypto' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    cloudantlib = require( 'cloudant' ),
    app = express();
var settings = require( './settings' );
var cloudant = cloudantlib( { account: settings.cloudant_username, password: settings.cloudant_password } );
cloudant.db.get( settings.cloudant_db, function( err, body ){
  if( err ){
    if( err.statusCode == 404 ){
      cloudant.db.create( settings.cloudant_db, function( err, body ){} );
    }
  }
});
var appEnv = cfenv.getAppEnv();

app.use( multer( { dest: './tmp/' } ).single( 'file' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.static( __dirname + '/public' ) );

app.all( '/*', basicAuth( function( user, pass ){
  return ( user == settings.basic_username && pass == settings.basic_password );
}));

app.get( '/', function( req, res ){
  var template = fs.readFileSync( __dirname + '/public/list.ejs', 'utf-8' );
  res.write( ejs.render( template, {} ) );
  res.end();
});

app.get( '/check', function( req, res ){
  var template = fs.readFileSync( __dirname + '/public/check.ejs', 'utf-8' );
  res.write( ejs.render( template, {} ) );
  res.end();
});

app.post( '/check', function( req, res ){
  var filepath = req.file.path;
  var filetype = req.file.mimetype;
  var originalname = req.file.originalname;

  var fileimage = fs.readFileSync( filepath );

  //. バイナリからハッシュ値生成
  var hash = crypto.createHash( 'sha512' );
  var fstream = fs.createReadStream( filepath );
  hash.setEncoding( 'hex' );
  fstream.on( 'end', function(){
    hash.end();
    var result = hash.read(); //. ハッシュ値

    //. 既存データかどうかを確認
    var db = cloudant.db.use( settings.cloudant_db );
    db.get( result, function( err0, body0 ){
      if( err0 ){
        if( err0.statusCode == 404 ){
          //. 見つからない＝既存データではない
          res.write( JSON.stringify( { status: 'no' }, 2, null ) );
          res.end();
        }else{
          //. その他のエラー
          res.write( JSON.stringify( { status: 'error' }, 2, null ) );
          res.end();
        }
      }else{
        //. 既存データ
        res.write( JSON.stringify( { status: 'yes' }, 2, null ) );
        res.end();
      }
    });

    fs.unlink( filepath, function( err ){} );
  });
  fstream.pipe( hash );
});

app.post( '/file', function( req, res ){
  var filepath = req.file.path;
  var filetype = req.file.mimetype;
  var originalname = req.file.originalname;

  var fileimage = fs.readFileSync( filepath );

  //. バイナリからハッシュ値生成
  var hash = crypto.createHash( 'sha512' );
  var fstream = fs.createReadStream( filepath );
  hash.setEncoding( 'hex' );
  fstream.on( 'end', function(){
    hash.end();
    var result = hash.read(); //. ハッシュ値

    //. 既存データかどうかを確認
    var db = cloudant.db.use( settings.cloudant_db );
    db.get( result, function( err0, body0 ){
      if( err0 ){
        if( err0.statusCode == 404 ){
          //. 見つからない＝既存データではない

          //. バイナリを Base64 変換
          var fileimage64 = new Buffer( fileimage ).toString( 'base64' );

          var param = {
            _id: result,
            filename: originalname,
            filetype: filetype,
            _attachments: {
              file: {
                content_type: filetype,
                data: fileimage64
              }
            }
          };

          db.insert( param, function( err1, body1, header1 ){
            if( err1 ){
              res.write( JSON.stringify( err1, 2, null ) );
              res.end();
            }else{
              res.write( JSON.stringify( body1, 2, null ) );
              res.end();
            }
          });
        }else{
          //. 既存データ
          res.write( JSON.stringify( { error: 'Existed data.' }, 2, null ) );
          res.end();
        }
      }
    });


    fs.unlink( filepath, function( err ){} );
  });
  fstream.pipe( hash );
});

app.get( '/files', function( req, res ){
  var db = cloudant.db.use( settings.cloudant_db );
  db.list( { include_docs: true }, function( err1, body1 ){
    if( err1 ){
      res.write( JSON.stringify( err1, 2, null ) );
      res.end();
    }else{
      res.write( JSON.stringify( body1, 2, null ) );
      res.end();
    }
  });
});

app.get( '/file', function( req, res ){
  var id = req.query.id;

  var db = cloudant.db.use( settings.cloudant_db );
  db.attachment.get( id, "file", function( err1, body1, head1 ){
    if( err1 ){
      if( err1.statusCode == 404 ){
        res.write( 'Not found with id = ' + id );
        res.end();
      }else{
        res.write( JSON.stringify( err1, 2, null ) );
        res.end();
      }
    }else{
      res.contentType( head1['content-type'] );
      res.end( body1, 'binary' );
    }
  });
});

app.delete( '/del_file', function( req, res ){
  var id = req.body.id;
  var db = cloudant.db.use( settings.cloudant_db );
  db.get( id, null, function( err1, body1, header1 ){
    if( err1 ){
      err1.file_id = "error-1";
      res.write( JSON.stringify( err1, 2, null ) );
      res.end();
    }else{
      var rev = body1._rev;
      db.destroy( id, rev, function( err2, body2, header2 ){
        if( err2 ){
          err2.file_id = "error-2";
          res.write( JSON.stringify( err2, 2, null ) );
          res.end();
        }else{
          body2.file_id = id;
          res.write( JSON.stringify( body2, 2, null ) );
          res.end();
        }
      });
    }
  });
});


var port = appEnv.port || 3000;
app.listen( port );
console.log( "server starting on " + port + " ..." );



