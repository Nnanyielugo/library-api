var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');

// Display list of all Genre
exports.genre_list = function(req, res, next) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function(err, list_genre){
            if (err){
                return next(err)
            }
            res.render('genre_list',{
                title: 'Genre List',
                genre_list: list_genre
            })
        })
};

// Display detail page for a specific Genre
exports.genre_detail = function(req, res) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },

        genre_books: function(callback) {
            // find all boook objects that have the genre Id in their genre field
            Book.find({'genre': req.params.id})
            .exec(callback);
        },
    }, function(err, results){
        if(err) {
            return next (err);
        }
        res.render('genre_detail', {
            title: 'Genre Detail',
            genre: results.genre,
            genre_books: results.genre_books
        });
    });
};

// Display Genre create form on GET
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', {title: 'Create Genre'}) 
};

// Handle Genre create on POST
exports.genre_create_post = function(req, res, next) {
    //check that the name field is not empty
    req.checkBody('name', 'Genre name required').notEmpty();

    //trim and escape the name field
    req.sanitize('name').escape();
    req.sanitize('name').trim();

    //run the validators
    var errors = req.validationErrors();

    //create a genre object with escaped and trimmed data
    var genre = new Genre({
        name: req.body.name
    });

    if(errors){
        //if there are errors, render the form again, passing the previously entered values and errors
        res.render('genre_form', {
            title: 'Create Genre',
            genre: genre,
            errors: errors
        });
        return;
    }
    else {
        //data from form is valid
        //check if genre with the same name already exists
        Genre.findOne({'name': req.body.name})
            .exec(function(err, found_genre){
                console.log('found_genre: ' + found_genre);
                if(err){
                    return next(err)
                }
                if(found_genre){
                    //genre exists, redirect to its detail page
                    res.redirect(found_genre.url);
                }
                else{
                    genre.save(function(err){
                        if(err){
                            return next(err);
                        }
                        res.redirect(genre.url);
                    })
                }
            })
    } 
};

// Display Genre delete form on GET
//Deleting a Genre is just like deleting an Author as both objects are dependencies of Books 
//(so in both cases you can delete the object only when the associated books are deleted.
exports.genre_delete_get = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id)
                .exec(callback)
        },
        genre_books: function(callback){
            Book.find({'genre': req.params.id})
                .exec(callback) 
        },
    }, function(err, results){
        if (err){
            return next(err);
        }
        res.render('genre_delete', {
            title: 'Delete Genre',
            genre: results.genre,
            genre_books: results.genre_books 
        });
    });
};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res, next) {
    req.checkBody('genreid', 'Genre id must exist').notEmpty();

    async.parallel({
        genre: function(callback){
            Genre.findById(req.body.genreid)
                .exec(callback);
        },
        genre_books: function(callback){
            Book.find({'genre': req.body.genreid}, 'title summary')
                .exec(callback);
        },
    }, function(err, results){
        if(err){
            return next(err);
        }
        //success
        if(results.genre_books.length > 0){
            //Genre has books. Re-ender in the same way as for a GET route
            res.render('genre_delete', {
                title: 'Delete Genre',
                genre: results.genre,
                genre_books: results.genre_books
            });
            return;
        }
        else{
            //genre has no books. Delete object and redirect to list of genres
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err){
                if (err){
                    return next(err);
                }
                res.redirect('/catalog/genres');
            })
        }
    })
};

// Display Genre update form on GET
exports.genre_update_get = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    Genre.findById(req.params.id)
        .exec(function(err, genre){
            if(err){
                return next(err);
            }
            res.render('genre_form', {
                title: 'Update Genre',
                genre: genre
            });
        });
};

// Handle Genre update on POST
exports.genre_update_post = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    req.checkBody('name', 'Genre must not be empty').notEmpty();

    req.sanitize('name').escape();
    req.sanitize('name').trim();

    var genre = new Genre ({
        name: req.body.name,
        _id: req.params.id
    });

    var errors = req.validationErrors();
    if(errors){
        res.render('genre_form',{
            title: 'Update Genre',
            genre: genre,
            errors: errors
        });
    }
    else{
        //data from form is valid. Update record
        Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre){
            if(err){
                return next(err);
            }
            res.redirect(thegenre.url)
        })
    }
};