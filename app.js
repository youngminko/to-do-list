const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

var items = [];

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//db connection
mongoose.connect("mongodb+srv://admin-young:dudals12@cluster0.4z7be.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String

}

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get ("/", function(req,res){

  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0)
    {
      Item.insertMany(defaultItems,function(err){
        if (err){
          console.log(err);
        }
        else{
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems})
    }
  });


});
//use lodash to convert first letter of the string to upper case
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  //compared to find() method where it returns array, this one just returns one object
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      }
      else{
        //show existing list
        res.render("List", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req,res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  }
  else{
    //pull items id that has corresponding id
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
})
app.get("/about",function(req,res){
  res.render("about");
});
//heroku dynamically sets the PORT or listen to local 3000
app.listen (process.env.PORT || 3000, function(){
  console.log("server started on port 3000");
});
