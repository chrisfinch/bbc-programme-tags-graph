
/*
 * GET home page.
 */

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/tag-pairs';

var mongoose = require('mongoose');
mongoose.connect(mongoUri);

var tagPair = mongoose.model('tagPair', { number: Number, tag: String, relation: String });

exports.index = function(req, res){

  term = req.query.term || "Jeremy_Clarkson";

  tagPair.find({ tag: term }, function (err, pairs) {

    // for (var p in pairs) {
    //   console.log("=========", pairs[p].relation, pairs[p].number);
    // }

    res.render('index', { title: 'Express', term: term });

  });

};

exports.data = function (req, res) {
  term = req.query.term || "Jeremy_Clarkson";

  tagPair.find({ tag: term }, function (err, pairs) {
    createData(term, pairs, function (data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(data));
      res.end();
      // for (var i = 0; i < data.nodes.length; i++) {
      //   if (i < 2 ) console.log(data.nodes[i]);
      // }
      // for (var i = 0; i < data.links.length; i++) {
      //   if (i < 2 ) console.log(data.links[i]);
      // }
    });
  });
};

var createData = function (term, pairs, callback) {
  console.log("searching term: ", pairs.length);
  var nodes = pairs.slice(0);

  // Compage array items based on relation (they can have different ID's...)
  var compare = function (el) {
    for (var l = 0; l < nodes.length; l++) {
      if (nodes[l].relation == el.relation) return false;
    }
    return true;
  };

  // Find index in array based on relation name (objects are diffent so cant use indexof())
  var find = function (el) {
    for (var l = 0; l < nodes.length; l++) {
      if (nodes[l].relation == el.relation) return l;
    }
  };

  // Find sets of relations for a tag from mongodb
  var findRelated = function (i) {
    tagPair.find({tag: pairs[i].relation}, function (err, relPairs) {

      pairs[i].related = relPairs;

      for (var k = 0; k < relPairs.length; k++) {
        if (compare(relPairs[k])) nodes.push(relPairs[k]);
      }

      if (i == pairs.length-1) findRelatedDone();
    });
  };

  // Callback once related stuff has been found
  var findRelatedDone = function () {

    // Build out array of links between pairs for D3
    var links = (function () {
      var arr = [];
      for (var i = 0; i < pairs.length; i++) {
        arr.push({
          source: 0,
          target: i+1
        });

        if (pairs[i].related && pairs[i].related.length) {

          if (i < 2 ) console.log(pairs[i], pairs[i].related);

          for (var j = 0; j < pairs[i].related.length; j++) {
            if (pairs[i].related[j].relation != pairs[i].tag) {
              arr.push({
                source: i,
                target: find(pairs[i].related[j])
              });
            }
          }
        }

      }
      return arr;
    })();

    // put the root item in at the middle
    var root = {
      number: 0,
      tag: term,
      relation: term
    };

    nodes.unshift(root);

    // callback with the finished data
    callback({
      nodes: nodes,
      links: links
    });
  };

  // Try to find sets of tags related to the relations of the main term :-S
  for (var i = 0; i < pairs.length; i++) {
    findRelated(i);
  }

  //findRelatedDone();

};
