// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' FILENAME');
  process.exit(1);
}

// Read the file and print its contents.
var fs = require('fs'),
    filename = process.argv[2];

var BufferedReader = require ("buffered-reader").DataReader;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/tag-pairs');

var tagPair = mongoose.model('tagPair', { number: Number, tag: String, relation: String });

var whitepace = /(^\s+|\s+$)/g,
    rgx1 = new RegExp("<http://dbpedia.org/resource/", "g"),
    rgx2 = new RegExp(">", "g");

var s = 0;

new BufferedReader (filename, { encoding: "utf8" })
    .on ("error", function (error){
        console.log ("error: " + error);
    })
    .on ("line", function (line){
        var l = line.replace(whitepace, "")
                    .replace(rgx1, "")
                    .replace(rgx2, "")
                    .split(" ");

        // Paisr only appear once in text file so the reverse relationship must also be stored
        var pair = new tagPair({
          number: l[0],
          tag: l[1],
          relation: l[2]
        });
        var reversePair = new tagPair({
          number: l[0],
          tag: l[2],
          relation: l[1]
        });
        pair.save(function (err, pair) {
          s++;
          if (!err) console.log("Saved: ", s);
        });
        reversePair.save(function (err, pair) {
          s++;
          if (!err) console.log("Saved: ", s);
        });
    })
    .on ("end", function (){
        console.log ("EOF");
        process.exit(0); // finish
    })
    .read ();
