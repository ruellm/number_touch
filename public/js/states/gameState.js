/**
    Main Game State
    Author: Ruell Magpayo <ruellm@yahoo.com>
    Created Dec 12, 2021
*/

// Global variables
var handBoxList = null;
var ballList = null;
var tooClose = false;

var circle1 = null;
var timer = null;
var globalTimer = null;

const SECONDS_PER_ROUND = 10;
const TOTAL_GAME_SECONDS = 60;

const TOTAL_CIRCLE = 3;
const POINTS_PER_CIRCLE = 2;
const POINTS_PER_MISTAKE = 1;

var timeLeft = 0.0;
var globalTimerLeft = 0.0;

var circleList = null;
var currentIndex = 0;
var score = 0;

var endGame = false;

//////////////////////////////////////////
function boxCollide(rect1, rect2)
{
    return (rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.h + rect1.y > rect2.y);

}
function randomNumber(min, max) { 
    return Math.random() * (max - min) + min;
} 
//////////////////////////////////////////

function GameState() {
        this._stateID = GAME_STATE_ID;
        this.ResetValues();
}


// set base class to State
GameState.prototype = new State;

GameState.prototype.ResetValues = function ()
{
}

GameState.prototype.Generate = function () {
    timer = new Timer();      
    timer.Start();

    circleList = new Array();
    currentIndex = 0;

    for(let i = 0; i < TOTAL_CIRCLE; i++)
    {
        circle1 = new NumberCircle();

       // var found = false;
        
        while(true) {
            circle1.cx = randomNumber(CIRCLE_RADIUS, DEFAULT_WINDOW_WIDTH  - ((CIRCLE_RADIUS*2)));
            circle1.cy = randomNumber(CIRCLE_RADIUS, DEFAULT_WINDOW_HEIGHT  - ((CIRCLE_RADIUS*2)));
            circle1.radius = CIRCLE_RADIUS;
            circle1.sequence = i;
            circle1.update(0.0);

            var found = false;

            var rect1 = {
                x: circle1.x,
                y: circle1.y,
                w: circle1.width,
                h: circle1.height
            };
            

            //check if it collides with other circle, thru bounding box test
            for(let c = 0; c < circleList.length; c++) {
                var rect2 = {
                    x: circleList[c].x,
                    y: circleList[c].y,
                    w: circleList[c].width,
                    h: circleList[c].height
                };

                if(boxCollide(rect1, rect2)){
                    found = true;
                    break;
                }
            }

            if(!found){
                circleList.push(circle1);
                break;
            }
        }
    
    }
}

GameState.prototype.Load = function () {

        //initialize values
        this.ResetValues();

        // create UI element
        this._uimanager = new UIManager();

        this.video = document.querySelector('video');

        ballList = new Array();

        tooClose = false;

        score = 0;

        particle = new ImageObject();
        particle.Init("images/particle-purple.png", 0, 0);       
      
        this.Generate();

        score = 0;
        globalTimer = new Timer();
        globalTimer.Start();
}


GameState.prototype.Update = function (elapsed) {
    timer.Update();
    globalTimer.Update();

    timeLeft = Math.floor(SECONDS_PER_ROUND - timer._elapsed);
    var pct = timeLeft / SECONDS_PER_ROUND;

    globalTimerLeft = Math.floor(TOTAL_GAME_SECONDS - globalTimer._elapsed);
    if(globalTimerLeft <= 0) {
        endGame = true;
        globalTimer.Stop();
    }

    let deadCount = 0;
    let found = false;

    for(let c = 0; c < circleList.length; c++){
        circleList[c].percentage = pct;
        circleList[c].update(elapsed);

        if(circleList[c].alive == false) {
            deadCount++;
            continue;
        }

        for(var j = 0; handBoxList && j <  handBoxList.length; j++) {
            const bbox = handBoxList[j];
        
            var rect1 = {
                x: bbox[0],
                y: bbox[1],
                w: bbox[2],
                h: bbox[2]
            };
            
            var rect2 = {
                x: circleList[c].x,
                y: circleList[c].y,
                w: circleList[c].width,
                h: circleList[c].height
            };

            if(boxCollide(rect2, rect1)) {
                if(circleList[c].sequence == currentIndex && !circleList[c].dying){
                    circleList[c].die();
                    currentIndex++;
                    score += POINTS_PER_CIRCLE;
                    found = true;
                    break;

                }else{
                    if(!circleList[c].wrong) {
                        circleList[c].setWrong(true);
                        score -= POINTS_PER_MISTAKE;
                        if(score < 0)
                            score = 0;
                    }
                }
            } else {
                circleList[c].setWrong(false);
            }

            if(found)
                break;
        }
    }

    if (pct <= 0.0 || deadCount >= TOTAL_CIRCLE && !endGame) {
        this.Generate();
    }
}

GameState.prototype.Capture = function(context){
        context.save();
        context.translate(DEFAULT_WINDOW_WIDTH, 0);
        context.scale(-1, 1);
        context.drawImage(this.video, 0, 0);
        context.restore();
}

var starDetecting = false;

GameState.prototype.Draw = function (gfx) {

    var ctx = gfx._canvasBufferContext;
    this.Capture(ctx);

    var style = "Bold 20pt Arial";
    ctx.font = style;

    if(g_model != null)
    {
        g_model.detect(gfx._canvasBuffer).then((predictions) => {
            //  console.log("Predictions: ", predictions);
            
            if(predictions.length <= 0) return;

            handBoxList = new Array();

            for(var i = 0; i < predictions.length;i++) {
                    if(predictions[i].label == "face") continue;
                    handBoxList.push(predictions[i].bbox);
            }

            if(!starDetecting) {
                starDetecting = true;
            }
        });
    }

    if(!starDetecting)
    {
        return;
    }

    if(handBoxList != null){
            var far = false;
            for(var i = 0; i < handBoxList.length; i++) {
                const bbox = handBoxList[i];

                var x  = (bbox[0] + bbox[2]/2) - (particle._width/2);
                var y = (bbox[1] + bbox[3]/2) - (particle._height/2);
                particle.Draw(gfx, x, y);        

                if(bbox[2] >= 200)
                    far = true;
            }
            
            if(tooClose != far)
                tooClose = far;
    }        
    

    if(tooClose) {
        var text = "Player is too close to camera";
        var textWidth = ctx.measureText(text);
    
        gfx.DrawText(text,
                (DEFAULT_WINDOW_WIDTH / 2) - (textWidth.width / 2),
                50,
                "rgb(255,255,255)", style);

    }

    gfx.DrawText("Score : " + score,
        0, 100,
        "rgb(255,255,255)", style);

    gfx.DrawText("Time : " + globalTimerLeft,
        DEFAULT_WINDOW_WIDTH - 150, 100,
        "rgb(255,255,255)", style);

    
    for(let c = 0; !endGame && c < circleList.length; c++){
        circleList[c].draw(gfx);
    }

    if(endGame) {
        var text = "Game Over";
        var textWidth = ctx.measureText(text);
    
        gfx.DrawText(text,
            (DEFAULT_WINDOW_WIDTH / 2) - (textWidth.width / 2),
            100,
            "rgb(255,255,255)", style);

    }

}

///////////////////////////////////////////////
// Destructor
///////////////////////////////////////////////
GameState.prototype.Unload = function () {

}


//
// Event handler callback
//
GameState.prototype.EventHandler = function (e) {

        ////////////////////////////////////////////////////////////////
        this.EventHandlerBase(e);

}
