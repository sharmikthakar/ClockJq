$(document).ready(function() {
			var clock = new Clock( ".clock");
			var clock1  = new Clock( ".clock-cdt");
			var clock2  = new Clock( ".clock-edt");
			var clock3  = new Clock( ".clock-pdt");
			clock1.moveBack(10.5);
			clock2.moveBack(9.5);
			clock3.moveBack(0.5);
			
		});
/* clock  */
(function($) {
    var Clock = window.Clock = function( target, options ) {
        this.options = $.extend({
            background: 'images/clock.png',
            width: 44,
            height: 44,
            minuteArmColors: {
                light: "#555753",
                dark: "#000000"
            },
            hourArmColors: {
                light: "#555753",
                dark: "#000000"
            },
            secondArmColors: {
                light: "#ef2929",
                dark: "#4f0000"
            },
            dotColors: {
                light: "#2e3436",
                dark: "#000000"
            },
            minuteArmDimensions: {
                thickness: 1,
                length: 12
            },
            hourArmDimensions: {
                thickness: 2,
                length: 10
            },
            secondArmDimensions: {
                thickness: 1,
                length: 15
            }
        }, options );

        this.offset = 0;	

        this.midX = Math.floor( this.options.width / 2 );
        this.midY = Math.floor( this.options.height / 2 );

        this.currentHour = 0;
        this.currentMinute = 0;
        this.currentSecond = 0;

        this.currentHourRotation = 0;
        this.currentMinuteRotation = 0;
        this.currentSecondRotation = 0;

        this.target = $( target );
        this.paper = Raphael( 
            this.target.get( 0 ),
            this.options.width, 
            this.options.height
        );

        this.background = this.paper.image( 
            this.options.background,
            0, 0,
            this.options.width, this.options.height
        );

        this.hourArm = this._createArm( 
            this.options.hourArmDimensions,
            this.options.hourArmColors
        );
        this.minuteArm = this._createArm( 
            this.options.minuteArmDimensions,
            this.options.minuteArmColors
        );
        this.secondArm = this._createArm( 
            this.options.secondArmDimensions,
            this.options.secondArmColors
        );

        this.paper.circle(
            this.midX,
            this.midY,
            3
        ).attr({
            stroke: "",
            gradient: [
                "r(0.25, 0.25)", 
                this.options.dotColors.light, 
                "-", this.options.dotColors.dark
            ].join( "" ) 
        });

        this._registerInterval( 1000 );
    }

    Clock.prototype = {
        _createArm: function( dimensions, color ) {
            var x = Math.floor( ( this.options.width - dimensions.thickness ) / 2 ),
                y = this.midY - dimensions.length;
           
            return this.paper.rect( 
                x, y,
                dimensions.thickness, dimensions.length
            ).attr({
                gradient: ["0-", color.dark, "-", color.light, ":50-", color.dark].join(""),
                stroke: "",
                rotation: "0"
            });
        },
        _updateTime: function( initial ) {
            var t      = new Date( (new Date()).getTime() - (this.offset * 1000) ),
                hour   = t.getHours(),
                minute = t.getMinutes(),
                second = t.getSeconds(),
                hourRotation   = ( hour * 30 ) + minute * 0.5 - ( minute * 0.5 % 6 ),
                minuteRotation = minute * 6,
                secondRotation = second * 6,
                easing = "bounce",
                durationSecond = 500,
                durationMinute = 500,
                durationHour   = 500;
            hour = hour > 12 ? hour - 12 : hour;
            if ( secondRotation == 6 ) {
                this.secondArm.rotate( 0.000001, this.midX, this.midY );
            }
            if ( secondRotation == 0 && minuteRotation == 6 ) {
                this.minuteArm.rotate( 0.000001, this.midX, this.midY );
            }
            if ( secondRotation == 0 && minuteRotation == 72 && hourRotation == 6 ) {
                this.hourArm.rotate( 0.000001, this.midX, this.midY );
            }

            this.secondArm.animate({
                rotation: [ secondRotation == 0 ? 360 : secondRotation, this.midX, this.midY ].join( " " )
            }, durationSecond, easing );
            
            this.minuteArm.animateWith( this.secondArm, {
                rotation: [ minuteRotation == 0 ? 360 : minuteRotation, this.midX, this.midY ].join( " " )
            }, durationMinute, easing );

            this.hourArm.animateWith( this.minuteArm, {
                rotation: [ hourRotation == 0 ? 360 : hourRotation, this.midX, this.midY ].join( " " )
            }, durationHour, easing );

            this.currentHour = hour;
            this.currentHourRotation = hourRotation;

            this.currentMinute = minute;
            this.currentMinuteRotation = minuteRotation;
            
            this.currentSecond = second;
            this.currentSecondRotation = secondRotation;
        },
        moveBack: function( hours ) {
            var offset = hours * 3600,
                realChange = offset + this.offset,
                minutes = Math.floor(offset / 60),
                rounds  = Math.floor(minutes / 60),
                duration         = 0 * minutes,
                durationPerRound = Math.floor(duration / rounds);
            window.clearInterval( this.interval );
            this.secondArm.animate({
                rotation: ["0", this.midX, this.midY].join( " " )
            }, (this.currentSecond) * 15, jQuery.proxy( function() {
                this._animateRounds( rounds, durationPerRound, jQuery.proxy( function() {
                    this.offset = realChange;
                    this._registerInterval( 1000 );
                }, this ) );
            }, this ));
        },
        _animateRounds: function( rounds, durationPerRound, fn ) {
            var oneRoundFx = jQuery.proxy( function() {
                if ( rounds-- > 0 ) {
                    this.minuteArm.animate({
                        rotation: [this.currentMinuteRotation - 360, this.midX, this.midY].join( " " ) 
                    }, durationPerRound, jQuery.proxy( function() {
                        this.minuteArm.rotate( this.currentMinuteRotation, this.midX, this.midY );
                        this.currentHourRotation -= 30;
                        oneRoundFx();
                    }, this ));
                    this.hourArm.animateWith( this.minuteArm, {
                        rotation: [this.currentHourRotation - 30, this.midX, this.midY].join( " " )
                    }, durationPerRound);
                }
                else {
                    fn();
                }
            }, this );
            oneRoundFx();
        },
        getOffset: function() {
            return this.offset;
        },
        _registerInterval: function( delay ) {
            delay = delay || 1000;
            window.setTimeout( jQuery.proxy( function() {
                this._updateTime( true );

                this.interval = window.setInterval( jQuery.proxy( function() {
                    this._updateTime();
                }, this ), 1000 );
            }, this ), delay );
        }
    }
})(jQuery);
