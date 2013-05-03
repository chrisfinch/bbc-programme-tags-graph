
/*
 * GET home page.
 */

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mydb';

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
    });
  });
};

var createData = function (term, pairs, callback) {

  var nodes = pairs.slice(0);

  var compare = function (el) {
    for (var l = 0; l < nodes.length; l++) {
      if (nodes[l].relation == el.relation) return false;
    }
    return true;
  };

  var find = function (el) {
    for (var l = 0; l < nodes.length; l++) {
      if (nodes[l].relation == el.relation) return l;
    }
  };

  var findRelated = function (i) {
    tagPair.find({tag: pairs[i].relation}, function (err, relPairs) {
      pairs[i].related = relPairs;
      nodes[nodes.indexOf(pairs[i])]["rad"] = relPairs.length;

      for (var k = 0; k < relPairs.length; k++) {
        if (compare(relPairs[k])) nodes.push(relPairs[k]);
      }

      if (i == pairs.length-1) findRelatedDone();
    });
  };

  for (var i = 0; i < pairs.length; i++) {
    findRelated(i);
  }

  var findRelatedDone = function () {
    console.log("DONE");
    var links = (function () {
      var arr = [];
      for (var i = 0; i < pairs.length; i++) {
        arr.push({
          source: 0,
          target: i+1
        });

        if (pairs[i].related && pairs[i].related.length) {
          for (var j = 0; j < pairs[i].related.length; j++) {

            arr.push({
              source: i,
              target: find(pairs[i].related[j])
            });

          }
        }

      }
      return arr;
    })();

    var root = {
      number: 0,
      tag: term,
      relation: term
    };

    nodes.unshift(root);

    callback({
      nodes: nodes,
      links: links
    });
  };

};
