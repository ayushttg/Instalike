//heroku -> logged in using college id     
// GITHUB REPO -> INSTAALIKE   //instaalike.herokuapp.com
const express=require("express");
const app=express();
const bodyParser=require("body-parser");
app.use(bodyParser.json());     
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({extended: true}))
const path=require("path");
const publicPath=path.join(__dirname,"public");
const mongoose=require("mongoose");
app.use(express.static(publicPath));
const port=3000 || process.env.PORT;
app.set("view engine","ejs");
const localStrategy=require("passport-local");

//Setting up the passport
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
app.use(session({
    secret: "SecretHaha",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
//Passport


//configuration of multer and cloudinary....

const cloudinary=require('cloudinary').v2;
const {CloudinaryStorage}= require('multer-storage-cloudinary')
const storage=new CloudinaryStorage({
    cloudinary: cloudinary,
    params:
    {
        folder: "Instalike",
        allowedFormats: ['jpeg','png','jppg']
    }
   
})
cloudinary.config({
    cloud_name: "lrbi12",
    api_key: "889241639422625" ,
    api_secret:  "6qdyw_-IgDEphtwX45G-MA3kj90"
})
const multer=require('multer')
const upload=multer({storage})

//mongodb+srv://archit:archit@cluster0.yd8qg.mongodb.net/?retryWrites=true&w=majority
const connectionURLnew="mongodb+srv://archit:archit@cluster0.yd8qg.mongodb.net/instalikeDatabasev2?retryWrites=true&w=majority";
const prevURL="mongodb://127.0.0.1:27017/instalikeDB22";
//college-id and mpass  (for mongo atlas)
mongoose.connect(connectionURLnew,{useNewUrlParser: true,useUnifiedTopology: true});
const userSchema=new mongoose.Schema({
    name: String,
    username: String,
    city: String,
    password: String,
    profileimg: String,
    rec_req:
    {
        type: Array,
        default: []
    },
    sent_req:
    {
        type: Array,
        default: []
    },
    followers:
    {
        type: Array,
        default: []
    },
    following:
    {
        type: Array,
        default: []
    },
    messages:
    {
        type:Array,
        default: []
    }
});

//Passport
userSchema.plugin(passportLocalMongoose);
//Passport
const User=mongoose.model("User",userSchema);
//Passport
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())
//Passport
const blogSchema=new mongoose.Schema({
    caption:
    {
        type: String,
    },
    likedby:
    {
        type: Array,
        default: []
    },
    image:
    {
        type: String,
  
    },
    createdby: String,
    timeStamp: Number,
    timeString: String
});
const Blog=mongoose.model("Blog",blogSchema);
const imgSchema=mongoose.Schema({
    username: String,
    profileimg: String
})
const Image=mongoose.model("Image",imgSchema);
const commentSchema=mongoose.Schema({
    blogid: String,
    comment: String,
    commentedBy: String
})
const Comment=mongoose.model("Comment",commentSchema);
const viewSchema=mongoose.Schema(
    {
        visits: Number
    }
)
const View=mongoose.model("View",viewSchema)
function isLoggedin(req,res,next)
{
    if(req.isAuthenticated())
    {
        return next();
    }
    res.redirect("/");
}
app.get("/",function(req,res)
{
    res.render("homepage");
});
app.get("/signup",function(req,res)
{
    res.render("signup");
});
//temporary register...
app.post("/registertemp",upload.single('profileimg'),(req,res)=>{
    const userObj = JSON.parse(JSON.stringify(req.body)); 
    // console.log(user); 
    const link=(typeof req.file==="undefined" ?  "https://www.searchpng.com/wp-content/uploads/2019/02/Profile-PNG-Icon.png": req.file.path);
    console.log(link)
    User.find({username: userObj.username},function(err,results)
    {
        if(results.length!=0){
            res.render("signupfail");
        }
        else
        {
            var newuser=userObj;
            console.log(newuser);
            const newimg=new Image({
                username: newuser.username,
                profileimg: link
            });
            newimg.save();
            var password=newuser.password;
            delete newuser["password"];
            newuser.profileimg=link
            // console.log(newuser);
            User.register(newuser,password,function(err,user)
            {
                res.redirect("/");
            })
        }
    })
})
app.post("/register",function(req,res)
{
    console.log("Req",req.body);
    User.find({username: req.body.username},function(err,results)
    {
        // console.log(results);
        if(results.length!=0)
        {
            // console.log("Error");
            // console.log(results);
            res.render("signupfail");
        }
        else
        {
            var newuser=req.body;
            console.log(newuser);
            if(newuser.profileimg==='')
            {
                //update link....
                newuser.profileimg="https://s3.amazonaws.com/whisperinvest-images-prod/default-profile.png";
            }
            //now need to create a image...
    
            const newimg=new Image({
                username: newuser.username,
                profileimg: newuser.profileimg
            });
            newimg.save();
            var password=newuser.password;
            delete newuser["password"];
            // console.log(newuser);
            User.register(newuser,password,function(err,user)
            {
                res.redirect("/");
            })
        }
    })
})
app.post("/login", passport.authenticate("local",
{
    successRedirect: "/profile",
    failureRedirect: "/loginfailed"
}))
app.get("/profile",isLoggedin,function(req,res)  //To be updated..profile homepage show all blogs available
{
    const loggedUser=req.user.username;
    User.findOne({username: loggedUser},function(err,user)
    {   var following=user.following;
        var results=[];
        following.push(loggedUser);
        Blog.find({},function(err,blogs)
        {
            // var cby=[];
            for(var i=0;i<blogs.length;i++)
            {
                for(var j=0;j<following.length;j++)
                {
                    if(blogs[i].createdby==following[j])
                    {
                        results.push(blogs[i]);
                        // cby.push(blogs[i].createdby);
                        break;
                    }
                }
            }

            results.sort(function(a,b){
                var time1=a.timeStamp;
                var time2=b.timeStamp;
                if(time1<time2)
                return -1;
                if(time1>time2)
                return -1;
                return 0;
            });
            // console.log("Sorted: ",results);
            Image.find({},function(err,images)
            {
                // console.log("Results: ",results);
                // console.log("Images: ",images);
                Comment.find({},function(err,comments)
                {
                    Image.findOne({username: req.user.username},function(err,image){
                        res.render("profilenew",{loggedUser: req.user.username,results: results,images: images,comments: comments,simage: image});
                    })

                   
                })
            })
          
        })
       
    })
})
app.get("/loginfailed",function(req,res)
{
    res.render("homepagefail");
})
app.get("/logout",function(req,res)
{
    req.logout();
    res.redirect("/");
})
app.get("/search",isLoggedin,function(req,res)
{
    const query=req.query.query.toLowerCase();
    // query=query.toLowerCase();
    if(query==="all")
    {
        User.find({},function(err,users)
        {
            var results=[];
            for(var i=0;i<users.length;i++)
            {
                if(users[i].username!=req.user.username)
                {
                    results.push(users[i]);
                }
            }
            console.log(results)
            Image.findOne({username: req.user.username},function(err,image)
            {
                res.render("searchresultsnew",{results: results,loggedUser: req.user.username,q: query,uimg: image.profileimg});
            })
            

        })
    }
    User.find({},function(err,users)
    {
       var results=[];
       for(var i=0;i<users.length;i++)
        {
            if(users[i].username===req.user.username)
            {
                continue;
            }
            var len=query.length;
            var poss=false;
            var currUsername=users[i].username;
            var currName=users[i].name;
            currUsername=currUsername.toLowerCase();
            currName=currName.toLowerCase();
            for(var k=0;k<=currName.length;k++)
            {
                if(currName.slice(k,k+len)==query )
                {
                    poss=true;
                    break;
                }
              
            }
            if(poss==true)
            {
                results.push(users[i]);
                continue;
            }
            for(var k=0;k<=currUsername.length;k++)
            {
                if(currUsername.slice(k,k+len)==query)
                {
                    poss=true;
                    break;
                }
            }
            if(poss==true)
            {
                results.push(users[i]);
                continue;
            }

        }
        // console.log(results);
        Image.findOne({username: req.user.username},function(err,image)
        {
           
            res.render("searchresultsnew",{results: results,loggedUser: req.user.username,q: query, uimg: image.profileimg});
        })
        
    })
})
//Follow Req related routes........................
app.get("/send/:userid",isLoggedin,function(req,res)
{
    var searchFor=req.params.userid;
    User.findOne({username: searchFor},function(err,user){
        var prev=user.rec_req;
        prev.push(req.user.username);
        User.findOneAndUpdate({username: searchFor},{$set:{rec_req: prev}},function(err,user){});
    })
    User.findOne({username: req.user.username},function(err,user){
        var prev=user.sent_req;
        prev.push(req.params.userid);
        User.findOneAndUpdate({username: req.user.username},{$set: {sent_req: prev}},function(err,user){});
        res.redirect("back");
    })
})
app.get("/cancel/:userid",isLoggedin,function(req,res)
{
    User.findOne({username: req.params.userid},function(err,user)
    {
        var prev=user.rec_req;
        var newR=[];
        for(var i=0;i!=prev.length;i++)
        {
            if(prev[i]!=req.user.username)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set: {rec_req: newR}},function(err,user){});
    })
    User.findOne({username: req.user.username},function(err,user)
    {
        var prev=user.sent_req;
        var newR=[];
        for(var i=0;i!=prev.length;i++)
        {
            if(prev[i]!=req.params.userid)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set: {sent_req: newR}},function(err,user){});
        res.redirect("back");   //Rediredict to a cancellation page...
    })
})
app.get("/delete/:userid",isLoggedin,function(req,res)
{
    User.findOne({username: req.user.username},function(err,user){
        var prev=user.rec_req;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.params.userid)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set:{rec_req: newR}},function(err,user){})
    })
    User.findOne({username: req.params.userid},function(err,user)
    {
        var prev=user.sent_req;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.user.username)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},function(err,user){});
        res.redirect("back");
    })
})
app.get("/accept/:userid",function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var prev=user.followers;
        prev.push(req.params.userid);
        var rec_req=user.rec_req;
        var newR=[];
        for(var i=0;i<rec_req.length;i++)
        {
            if(rec_req[i]!=req.params.userid)
            {
                newR.push(rec_req[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set:{followers: prev,rec_req: newR}},
            function(err,user){});
    })
    User.findOne({username: req.params.userid},function(err,user)
    {
        var prev=user.following;
        prev.push(req.user.username);
        var sent_req=user.sent_req;
        var newR=[];
        for(var i=0;i<sent_req.length;i++)
        {
            if(sent_req[i]!=req.user.username)
            {
                newR.push(sent_req[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set:{following: prev,sent_req: newR}},
            function(err,user){});
            res.redirect("back");
    })
})
app.get("/requests",function(req,res)                 //to get received requests... 
{ 
    User.findOne({username: req.user.username},function(err,user)
    {
        // console.log(user.rec_req);
        var results=[];
        var recR=user.rec_req;
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                var username=users[i].username;
                
                for(var j=0;j<recR.length;j++)
                {
                   
                    // console.log(recR[j]);
                    if(recR[j]===username)
                    {
                        results.push(users[i]);
                        // console.log(users[i]);
                        break;
                    }
                }
            }
            Image.findOne({username: req.user.username},function(err,image)
            {
                // console.log(results)
                res.render("requestsrec",{results: results,loggedUser: req.user.username, uimg: image.profileimg});
            })
            
            // console.log("Results: ",results);
        })
        // res.send("Welcome...");
        // res.render("requestsrec",{requests: user.rec_req,loggedUser: req.user.username});
    })
    
})
app.get("/sentrequests",isLoggedin,function(req,res)    //to get sent requests
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var sentR=user.sent_req;
        var results=[];
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                for(var j=0;j<sentR.length;j++)
                {
                    if(sentR[j]==users[i].username)
                    {
                        results.push(users[i]);
                        break;
                    }
       
                }
            }
   
            res.render("sentreq.ejs",{results: results,loggedUser: req.user.username});
        })
      
    })
})
app.get("/followers",isLoggedin,function(req,res)    //to get followers
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var results=[];
        var followers=user.followers;
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                for(var j=0;j<followers.length;j++)
                {
                    if(followers[j]==users[i].username)
                    {
                        results.push(users[i]);
                        break;
                    }
                }
            }
            // console.log("Results,",results);
            Image.findOne({username: req.user.username},function(err,image)
            {
                res.render("followers",{results: results,loggedUser: req.user.username,uimg: image.profileimg});
            })
            
        })
    })
    // res.render("manage.ejs",{loggedUser: req.user.username});
})
app.get("/following",isLoggedin,function(req,res)    //to get following
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var results=[];
        var following=user.following;
        User.find({},function(err,users)
        {
            for(var i=0;i<users.length;i++)
            {
                for(var j=0;j<following.length;j++)
                {
                    if(following[j]==users[i].username)
                    {
                        results.push(users[i]);
                        break;
                    }
                }
            }
            // console.log("Results,",results);
            Image.findOne({username: req.user.username},function(err,image)
            {
                res.render("following",{results: results,loggedUser: req.user.username,uimg: image.profileimg});
            })
            
        })
    })
})
app.get("/unfollow/:userid",function(req,res)
{
    User.findOne({username: req.user.username},function(err,user){
        var prev=user.following;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.params.userid)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set:{following: newR}},function(err,user){});
    })
    User.findOne({username: req.params.userid},function(err,user){
        var prev=user.followers;
        var newR=[];
        for(var i=0;i<prev.length;i++)
        {
            if(prev[i]!=req.user.username)
            {
                newR.push(prev[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set:{followers: newR}},function(err,user){});
        res.redirect("back");
    })
})
app.get("/remove/:userid",function(req,res)
{
    User.findOne({username: req.user.username},function(err,user)
    {
        var followers=user.followers;
        var newR=[];
        for(var i=0;i<followers.length;i++)
        {
            if(followers[i]!=req.params.userid)
            {
                newR.push(followers[i]);
            }
        }
        User.findOneAndUpdate({username: req.user.username},{$set: { followers: newR}},function(err,res){});
    })
    User.findOne({username: req.params.userid},function(err,user)
    {
        var following=user.following;
        var newR=[];
        for(var i=0;i<following.length;i++)
        {
            if(following[i]!=req.user.username)
            {
                newR.push(following[i]);
            }
        }
        User.findOneAndUpdate({username: req.params.userid},{$set:{following: newR}},function(err,user){});
        res.redirect("back");
    })
})
app.post("/newposttemp",upload.single('image'),function(req,res){
    const newblog=JSON.parse(JSON.stringify(req.body))
    console.log("new Blog: ",newblog);
    newblog["createdby"]=req.user.username;
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var today  = new Date();
    newblog["timeString"]=today.toLocaleTimeString("en-US",options);
    newblog["timeStamp"]=today.getTime();

    const link=(typeof req.file==="undefined") ? "https://i0.pickpik.com/photos/769/703/611/apple-computer-iphone-keyboard-preview.jpg" : req.file.path;
    newblog["image"]=link;
    console.log("img: ",link);
    const newB=new Blog(newblog);
    newB.save();
    res.redirect("/profile");
})
app.post("/newpost",function(req,res)
{
    var newblog=req.body;
    newblog["createdby"]=req.user.username;
    var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var today  = new Date();
    newblog["timeString"]=today.toLocaleTimeString("en-US",options);
    newblog["timeStamp"]=today.getTime();
    if(newblog["image"]==="")
    {
        newblog["image"]="https://i0.pickpik.com/photos/769/703/611/apple-computer-iphone-keyboard-preview.jpg";
    }
    // console.log(newblog);
    const newB=new Blog(newblog);
    newB.save();
    res.redirect("/profile");
})
app.get("/like/:blogid",function(req,res)
{
    Blog.findOne({_id: req.params.blogid},function(err,blog)
    {
        var likes=blog.likedby;
        likes.push(req.user.username);
        Blog.findOneAndUpdate({_id: req.params.blogid},{$set:{likedby: likes}},function(err,blog){});
        res.redirect("back");
    })
})
app.get("/unlike/:blogid",function(req,res)
{
    Blog.findOne({_id: req.params.blogid},function(err,blog)
    {
        var likes=blog.likedby;
        var newlikes=[];
        for(var i=0;i<likes.length;i++)
        {
            if(likes[i]!=req.user.username)
            {
                newlikes.push(likes[i]);
            }
        }
        Blog.findOneAndUpdate({_id: req.params.blogid},{$set:{likedby: newlikes}},function(err,blog){});
        res.redirect("back");
    })
})

app.get("/deleteblog/:blogid",function(req,res)
{
    Blog.findOneAndDelete({_id: req.params.blogid},function(err,blog){});
    res.redirect("back");
})
app.get("/deleteblogg/:blogid",function(req,res)
{
    Blog.findOneAndDelete({_id: req.params.blogid},function(err,blog){});
    res.redirect("/viewprofile/"+req.user.username);
})
app.get("/deleteComment/:cid",function(req,res){
    Comment.findOneAndDelete({_id: req.params.cid},function(err,comments){res.redirect("back");});
})
// const commentSchema=mongoose.Schema({
//     blogid: String,
//     comment: String,
//     commentedBy: String
// })
// const Comment=mongoose.model("Comment",commentSchema);
app.post("/addcomment/:blogid",function(req,res)
{
    // console.log(req.body);
    // console.log(req.params.blogid);
    const newComment={
        blogid: req.params.blogid,
        comment: req.body.comment,
        commentedBy: req.user.username
    }
    const nc=new Comment(newComment);
    nc.save();
    res.redirect("back");
})
app.get("/viewprofile/:userid",isLoggedin,function(req,res)
{
    var showblogs=false;
    if(req.params.userid===req.user.username)
    {
        showblogs=true;      
    }
    User.findOne({username: req.user.username},function(err,user)
    {
 
        var following=user.following;
        var isfollowing=false;
        var sentReq=user.sent_req;
        var as=false;
        for(var i=0;i<sentReq.length;i++)
        {
            if(sentReq[i]===req.params.userid)
            {
                as=true;
                break;
            }
        }
        for (var i=0;i<following.length;i++)
        {
            if(following[i]==req.params.userid)
            {
                isfollowing=true;
                break;
            }
        }
        if(isfollowing===true)
        showblogs=true;
        User.findOne({username: req.params.userid},function(err,su){
            Blog.find({createdby: req.params.userid},function(err,blogs)
            {
                Image.findOne({username: req.user.username},function(err,userimg)
                {
                    Image.findOne({username: req.params.userid},function(err,searchuser)
                    {
                    
                        res.render("userprofile.ejs",{blogs: blogs,user: userimg,search:searchuser,showblogs: showblogs,su: su,as: as});
                    })
                })
            })
        })
 

    })
})
app.get("/deleteacc",isLoggedin,function(req,res)
{
    User.findOneAndDelete({username: req.user.username},function(err,user){});
    Blog.find({createdby: req.user.username},function(err,blogs)
    {
        // console.log(blogs);
    })
    Image.findOneAndDelete({username: req.user.username},function(err,images){});
    Comment.find({commentedBy: req.user.username},function(err,comments)
    {
        // console.log(comments);
    })
    res.redirect("/logout")
})
app.get("/expand/:blogid",isLoggedin,function(req,res)
{
    Blog.findOne({_id: req.params.blogid},function(err,blog)
    {
        Image.find({},function(err,images)
        {
            Comment.find({blogid:req.params.blogid},function(err,comments)
            {
                Image.findOne({username: req.user.username},function(err,img)
                {
                    res.render("blogdetails",{uname: req.user.username,uimg: img,blog: blog, images: images,comments: comments});
                })
                
            })
        })
    })
})
app.get("/suggestions",isLoggedin,function(req,res)
{
    User.find({},function(err,results)
    {
        User.findOne({username: req.user.username},function(err,user)
        {
            var following=user.following;
            var nr=[]
            for(var i=0;i!=results.length;i++)
            {
                if(results[i].username===req.user.username)
                continue;
                var fw=false;
                var rs=false;
                for(var j=0;j<following.length;j++)
                {
                    if(following[j]===results[i].username)
                    {
                        fw=true;
                        break;
                    }
                }
                var sentR=user.sent_req;
                for(var j=0;j<sentR.length;j++)
                {
                    if(sentR[j]===results[i].username)
                    {
                        rs=true;
                        break;
                    }
                }
                if(fw===false && rs===false)
                nr.push(results[i]);
            }
            Image.findOne({username: req.user.username},function(err,image)
            {
                res.render("suggestions",{results: nr,loggedUser: req.user.username,uimg: image.profileimg});
            })
        })

    })
})
app.listen(process.env.PORT || 3000,function(){
    console.log("Server has started!!")
})