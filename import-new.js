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
mongoose.connect('mongodb://localhost/tag-adjacency');

//var record = mongoose.model('tagPair', { number: Number, tag: String, relation: String });
var item = mongoose.model('tag', { name: String, related: mongoose.Schema.Types.Mixed });
var relatedItem = function (id, weight) { return {id: id, weight: weight}; };
var items = {};

var whitespace = /(^\s+|\s+$)/g,
    rgx1 = new RegExp("<http://dbpedia.org/resource/", "g"),
    rgx2 = new RegExp(">", "g");

var s = 0;

new BufferedReader (filename, { encoding: "utf8" })
    .on ("error", function (error){
        console.log ("error: " + error);
    })
    .on ("line", function (line){
        var l = line.replace(whitespace, "")
                    .replace(rgx1, "")
                    .replace(rgx2, "")
                    .split(" ");

        if (!items[l[1]]) {
          s++;
          items[l[1]] = new item({
            name: l[1],
            related: []
          });
        }

        if (!items[l[2]]) {
          s++;
          items[l[2]] = new item({
            name: l[2],
            related: []
          });
        }

        items[l[1]].related.push(new relatedItem(items[l[2]]._id, l[0]));
        items[l[2]].related.push(new relatedItem(items[l[1]]._id, l[0]));

        // Paisr only appear once in text file so the reverse relationship must also be stored
        // var pair = new tagPair({
        //   number: l[0],
        //   tag: l[1],
        //   relation: l[2]
        // });
        // var reversePair = new tagPair({
        //   number: l[0],
        //   tag: l[2],
        //   relation: l[1]
        // });
        // pair.save(function (err, pair) {
        //   s++;
        //   if (!err) console.log("Saved: ", s);
        // });
        // reversePair.save(function (err, pair) {
        //   s++;
        //   if (!err) console.log("Saved: ", s);
        // });
    })
    .on ("end", function (){
        console.log ("EOF");
        var x = 0;
        for (var i in items) {
          if (items.hasOwnProperty(i)) {
            items[i].save(function (err, item) {
              x++;
              console.log("Saved: ",item.name, " | ", x, " of ", s);
              if (x==s) {
                console.log("DONE================");
                process.exit(0); // Finish
              }
            });
          }
        }
    })
    .read ();
