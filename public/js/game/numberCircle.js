
function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

class NumberCircle
{
    constructor()
    {
        // public members
        this.percentage = 1.0;
        this.radius = CIRCLE_RADIUS;
        this.cx = 0;
        this.cy = 0;
        this.sequence = 0;

        this.alive = true;

        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.dying = false;
        this.alpha = 1.0;
        this.wrong = false;

        this.xImage = new ImageObject();
        this.xImage.Init("images/x100.png", 0, 0);       
    }

    die()
    {
        this.dying = true;
    }

    setWrong(value)
    {
        if(this.dying) return;

        this.wrong = value;
    }

    update(elapsed)
    {
        this.x = this.cx - this.radius;
        this.y = this.cy - this.radius;

        let maxX = this.cx + this.radius;
        let maxY = this.cy + this.radius;

        this.width = maxX - this.x;
        this.height = maxY - this.y;

        if(this.dying)
        {
            var ALPHA_STEP = 6;
            var SIZE_STEP = 200;

            this.alpha -= (ALPHA_STEP * elapsed);
            if(this.alpha <= 0)
            {
                this.alive = false;
            }

            this.radius += (SIZE_STEP * elapsed);
        }
    }

    draw(gfx)
    {
        if(!this.alive) return;

        var angle = this.percentage * 360;
        var endAngle = degrees_to_radians(angle);
        var context = gfx._canvasBufferContext;

        context.save();
        context.globalAlpha = this.alpha;
        context.beginPath();
        context.arc(this.cx, this.cy, this.radius, 0, endAngle, false);
        context.fillStyle = 'white';
        context.fill();
        context.lineWidth = 10;
        context.strokeStyle = '#FFFFFF';
        context.stroke();

        context.beginPath();
        context.arc(this.cx, this.cy, this.radius-2, 0, 2 * Math.PI, false);
        context.fillStyle = 'green';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = '#003300';
        context.stroke();

        var ctx = gfx._canvasBufferContext;
    
        var style = "Bold 30pt Arial";
        ctx.font = style;

        var actual = this.sequence+1;
        var text = "" + actual;
        var textWidth = ctx.measureText(text);
    
        gfx.DrawText(text,
            this.cx - (textWidth.width/2), this.cy + 15,
               "rgb(255,255,255)", style);

        if(this.wrong) {
            this.xImage.Draw(gfx, this.cx - this.xImage._width/2,
                this.cy - this.xImage._height/2);
        }

        context.restore();

        if(this.dying) {
                var style = "Bold 40pt Arial";
                gfx.DrawText("+2",
                    this.cx + CIRCLE_RADIUS + 5, this.cy + 15,
                    "rgb(255,255,255)", style);

        } else if(this.wrong) {
            var style = "Bold 40pt Arial";
            gfx.DrawText("-1",
                this.cx + CIRCLE_RADIUS + 5, this.cy + 15,
                "rgb(255,0,0)", style);
        }
    }
}