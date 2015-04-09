window.onload = function() 
{
    "use strict";
    
    var game = new Phaser.Game( 640, 480, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update } );
    game.antialias = false;

    // create a list to store our game entities
    var ents = [];

    //Define some useful functions

    function array2d(xsize,ysize,val)
    {
        var array = [];
        for(var i = 0; i<xsize; i++)
        {
            array[i] = [];
        }

        for (var x=0; x<xsize; x++)
            for(var y=0; y<ysize; y++)
                array[x][y] = val;

        return array;
    }

    function clamp(val,min,max)
    {
        if (val<min)
            return min;
        if (val>max)
            return max;
        return val;
    }

    function randomInt(max)
    {
        var i = Math.random()*(max+1)
        return ~~(i);
    }

    function choose(choices)
    {
        var index = ~~(rand()*choices.length);
        return choices[index];
    }

    function degstorads(degs) 
    //Given Degrees, Return Radians
    {
        return degs * (Math.PI/180);
    }

    function lengthdir_x(len,dir)
    //given a length and an angle (in Degrees), return the horizontal (x) component of 
    //the vector of the angle and direction
    {
        return len * Math.cos(degstorads(dir));
    }

    function lengthdir_y(len,dir)
    // Performs the same function as lengthdir_x, but returns the vertical component
    {
        return len * Math.sin(degstorads(dir));
    }

    function point_distance(x1,y1,x2,y2) 
    // Returns the distance between two points
    // will be used to perform circle collisions
    {
        var xdif = x1-x2;
        var ydif = y1-y2;
        return Math.sqrt(xdif*xdif+ydif*ydif);
    }

    function point_direction(x1,y1,x2,y2)
    // return as a degree the angle between two points
    {
        var xdif = x2 - x1;
        var ydif = y2 - y1;

        return Math.atan2(ydif,xdif)*180 / Math.PI;
    }

    var SEED;
    function rand()
    // random number generator for javascript that I found on stackoverflow,
    // because you apparently can't seed javascripts built in rng
    // found here: http://stackoverflow.com/questions/521295/javascript-random-seeds
    {
        var rand = Math.sin(++SEED)*10000;
        return rand - Math.floor(rand);
    }

    function szudzkik(x,y)
    // pairing function
    {
        if (x<y)
            return y*y+x;
        else
            return x*x+x+y;
    }

    function createImage(x,y,spr)
    {
        var i = game.add.image(x,y,spr);
        i.anchor.setTo(0.5,0.5);
        //i.scale.setTo(2,2);

        return i;
    }

    function entityCreate(ent)
    //adds an entity to the entity list 
    {
        var i = ents.push(ent);
        ent.id = i-1;
    }

    function entityDestroy(i)
    // destroys the entities Phaser image and removes it from the entity list
    {
        ents[i].destroy();
        ents[i].ph.destroy();
        ents.splice(i,1);
    }

    function entity(x,y,sprite)
    {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.radius = 8;
        this.alive = true;
        this.visible = true;
        this.id = 0;

        this.ph = game.add.image(this.x,this.y,this.sprite);
        this.ph.anchor.setTo(0.5);
        //this.ph.scale.setTo(2,2);

        this.step = function(){}

        this.destroy = function(){}

        this.draw = function()
        {
            this.ph.x = this.x;
            this.ph.y = this.y;
        }
    }

    

    function preload() 
    {
        game.load.image('star','assets/star.png');
        game.load.image('sun','assets/sun.png');
        game.load.image('suncircle','assets/sunCircle.png');
    }

    var vowels = ["a","e","i","o","u"];
    var cons = ["b","c","d","f","g","h","j","k","l","m","n","p","q","r","s","t","v","x","y","z"];

    function makeName()
    {
        var str = "";
        var len = 4+Math.floor(rand()*16);
        var v = choose([false,true]);
        for(var i = 0; i< len; i++)
        {
            v=!v;
            if (v)
                str+=choose(vowels);
            else
                str+=choose(cons);
        }
        return str;
    }

    function makeColor(r,g,b)
    {
        return 0x000000 | (r << 16) | (g<<8) | b;
    }

    var CAMX = 32000;
    var CAMY = 32000;

    var bitmap;
    var bitmapObject;
    var stars;
    var suns;
    var sunCircle;
    var galaxySeed = 0;
    var universeSeed = 8;
    var depth = 600;
    var text;
    function create() 
    {
       bitmap = game.add.bitmapData(640,480);
       bitmap.smoothed = false;
       bitmapObject = bitmap.addToWorld();
       stars = game.make.image(0,0,'star');
       stars.anchor.setTo(0.5,0.5);
       suns = game.make.image(0,0,'sun');
       suns.anchor.setTo(0.5,0.5);
       sunCircle = game.make.image(0,0,'suncircle');
       sunCircle.anchor.setTo(0.5,0.5);
       SEED = universeSeed;

        text = game.add.text(0, 0, "", {
            font: "12px Courier New",
            fill: "#ffffff",
            align: "left"
        });
        text.anchor.setTo(0,0);

       game.canvas.oncontextmenu = function (e) { e.preventDefault(); };
    }
    var SunRot = 0;
    var state = 0;
    /*
        possible states: 
        0 = universe
        1 = galaxy
        2 = planet
    */
    function drawStars()
    {
            var starCount;
            var s;
            var starx, stary;
            var tilex = 0;
            var tiley = 0;
            
            for(var xx=-2; xx<22; xx+=1)
                for(var yy=-2; yy<22; yy+=1)
                {
                    tilex = ~~(CAMX/32)+xx;
                    tiley = ~~(CAMY/24)+yy;

                    SEED = szudzkik(tilex,tiley);
                    stars.tint = makeColor(rand()*0xff,rand()*0xff,rand()*0xff);
                    if (rand()<0.23)
                    {
                        var starSize = 1+rand()*2;
                        var z = rand()*400;
                        var par = depth / (depth - z);
                        var ang = rand()*360;
                        starx = par*(32*(tilex + rand()) - CAMX);
                        stary = par*(24*(tiley + rand()) - CAMY); 
                        if ( point_distance(game.input.x,game.input.y,starx,stary)<starSize*8 )
                        {
                            stars.tint = 0xffffff;
                            if (game.input.mouse.button === 0)
                            {
                                state = 1;
                                galaxySeed = szudzkik(tilex,tiley);
                            }
                        }
                        stars.scale.setTo(starSize);
                        stars.angle = ang;
                        bitmap.draw(stars,starx,stary);
                    }
                }

            if (game.input.mouse.button === 2)
            {
                CAMX += lengthdir_x(4,point_direction(320,240,game.input.x,game.input.y))
                CAMY += lengthdir_y(4,point_direction(320,240,game.input.x,game.input.y))
            }
    }

    function drawGalaxy()
    {
        SunRot++;
        SEED = galaxySeed;
        suns.tint = makeColor(rand()*0xff,rand()*0xff,rand()*0xff);
        var name = "System: "+makeName();
        text.setText(name);
        var scale = 0.5+rand()*16;
        suns.scale.setTo(scale,scale);
        sunCircle.scale.setTo(scale,scale);
        sunCircle.angle = -SunRot;
        suns.angle = SunRot; 
        bitmap.draw(suns,320,240);
        sunCircle.tint = 0xffffff;
        bitmap.draw(sunCircle,320,240);
        
        var planets = Math.floor(rand()*8);
        for(var i = 0; i<planets; i++)
        {
            var dist = 240 - rand()*120
            var rotSpeed = 1+rand()*2;
            var rot = SunRot*rotSpeed+rand()*360;
            var px = 320+lengthdir_x(dist,rot);
            var py = 240+lengthdir_y(dist,rot);

            var psize = 0.25+rand()*4;
            sunCircle.tint = makeColor(rand()*0xff,rand()*0xff,rand()*0xff);
            sunCircle.scale.setTo(psize,psize);
            bitmap.draw(sunCircle,px,py);
        }

        if (game.input.mouse.button === 2)
        {
           SEED = universeSeed;
           text.setText("");
           state = 0;
        }
    }

    function update() 
    {           
        bitmap.clear();

        if (state === 0)
        {
            drawStars();

        }
        else
        if (state === 1)
        {
            drawGalaxy();
        }
    }
}