
/*
 * GET home page.
 */

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/tag-adjacency';

var mongoose = require('mongoose');
mongoose.connect(mongoUri);

var Item = mongoose.model('tag', { name: String, related: mongoose.Schema.Types.Mixed });

exports.index = function(req, res){

  term = req.query.term || "Jeremy_Clarkson";

  res.render('index', { title: 'Express', term: term });

};

exports.data = function (req, res) {
  term = req.query.term || "Jeremy_Clarkson";

  Item.findOne({ name: term }, function (err, foundItem) {
    createData(term, foundItem, 2, function (data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(data));
      res.end();
    });
  });
};

var createData = function (term, sourceItem, depth, callback) {
  console.log("found root item: ", sourceItem, "==============");
  var nodes = [];
  var links = [];

  var recursiveSearch = function (startingItems, depth, done) {

    this.currentDepth = 0;

    this.search = function (items) {
      var that = this;
      var foundItems = [];
      that.currentDepth++;

      console.log("Starting out with some items: ", items);

      // y & i incorrect inside loops...
      var outerIterator = 0;
      items.forEach(function (item, y) {
        outerIterator++;
        var innerIterator = 0;
        item.list.forEach(function (e, i) {
          Item.findOne({_id: e.id}, function (err, foundItem) {

            innerIterator++;

            //foundItems = foundItems.concat(foundItem.related);
            nodes.push({
              name: foundItem.name
            });

            links.push({
              source: item.index,
              target: nodes.length,
              _weight: parseInt(e.weight, 10)
            });

            foundItems.push({
              index: nodes.length,
              list: foundItem.related
            });

            //console.log("DEPTH: ", that.currentDepth, " outerIterator: ", outerIterator, " items.length-1: ", items.length-1, " innerIterator: ", innerIterator, "item.list.length-1: ", item.list.length-1);
            if (that.currentDepth <= depth-1 && innerIterator == item.list.length && outerIterator == items.length) {
              that.search(foundItems);
            } else if (innerIterator == item.list.length && outerIterator == items.length) {
              console.log("DONE???");
              done();
            }
          });
        });
      });
    };

    this.search(startingItems);

  };

  recursiveSearch([{index:0, list: sourceItem.related}], depth, function () {
    console.log("DONE");
    var root = {
      name: sourceItem.name
    };
    nodes.unshift(root);
    callback({
      nodes: nodes,
      links: links
    });
  });

};
