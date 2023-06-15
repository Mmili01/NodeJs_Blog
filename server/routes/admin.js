const express = require(`express`);
const { get } = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET;

// check login
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// get the admin-login page

router.get("/admin", async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "this is the post",
    };

    res.render("admin/index", { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

// check login of admin
router.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

// admin dashboard

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Dashboard",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    const data = await Post.find();
    res.render("admin/dashboard", {
      locals,
      data,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

// admin create new post (get route) linked to the dashboard

router.get("/add-post", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Add Post",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    const data = await Post.find();
    res.render("admin/add-post", {
      locals,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

// admin create new post (post route) linked to the dashboard

router.post("/add-post", authMiddleware, async (req, res) => {
  try {
    try {
      const newPost = new Post({
        title: req.body.title,
        body: req.body.body,
      });

      await Post.create(newPost);
      res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
});

// get route for the update post
router.get("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Blog",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };
    const data = await Post.findOne({ _id: req.params.id });

    res.render("admin/edit-post", {
      locals,
      data,
      layout: adminLayout,
    });
  } catch (error) {
    console.log(error);
  }
});

// admin update new post  linked to the dashboard

router.put("/edit-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now(),
    });

    res.redirect(`/edit-post/${req.params.id}`);
    // await Post.create(newPost);
    // res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

// admin delete post
router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
});

// // pagination for dashboard

// router.get('', async (req, res) => {
//   try {
//     const locals = {
//       title: "NodeJs Blog",
//       description: "Simple Blog created with NodeJs, Express & MongoDb."
//     }

//     let perPage = 10;
//     let page = req.query.page || 1;

//     const data = await Post.aggregate([ { $sort: { createdAt: -1 } } ])
//     .skip(perPage * page - perPage)
//     .limit(perPage)
//     .exec();

//     const count = await Post.count();
//     const nextPage = parseInt(page) + 1;
//     const hasNextPage = nextPage <= Math.ceil(count / perPage);

//     res.render('/dashboard', {
//       locals,
//       data,
//       current: page,
//       nextPage: hasNextPage ? nextPage : null,
//       currentRoute: '/'
//     });

//   } catch (error) {
//     console.log(error);
//   }

// });

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ username, password: hashedPassword });
      res.status(201).json({ message: "User Created", user });
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).json({ message: "User already exists" });
      }
      res.status(500).json({ message: "internal server error" });
    }
    res.redirect("/admin");
    // const data = await Post.find();
    // res.render("index", {locals, data})
  } catch (error) {
    console.log(error);
  }
});

router.get("/register", (req, res) => {
  res.render("admin/register");
});

// logout route
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  //res.json({ message: 'Logout successful.'});
  res.redirect("/");
});

module.exports = router;

// router.get("/admin", async(req, res)=>{
//     const locals = {
//         title: "my first post",
//         description: "this is the post"

//     }
//     try {
//         const data = await Post.find();
//         res.render("index", {locals, data})
//     } catch (error) {
//         console.log(error)
//     }
// })
