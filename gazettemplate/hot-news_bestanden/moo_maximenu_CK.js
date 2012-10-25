/**
 * @copyright	Copyright (C) 2010 Cédric KEIFLIN alias ced1870
 * http://www.ck-web-creation-alsace.com
 * http://www.joomlack.fr
 * Module Maximenu_CK for Joomla!
 * @license		GNU/GPL
 * */

if (typeof(MooTools) != 'undefined'){

    var DropdownMaxiMenu = new Class({
        Implements: Options,
        options: {    //options par defaut si aucune option utilisateur n'est renseign�e
			
            mooTransition : 'Bounce',
            mooEase : 'easeOut',
            mooDuree : 500,
            useOpacity : '0',
            menuID : 'maximenuCK',
            testoverflow : '1',
            orientation : '0',
            style : 'moomenu',
            opentype : 'open',
            direction : 'direction',
            directionoffset1 : '30',
            directionoffset2 : '30',
            dureeOut : 500
        },
			
        initialize: function(element,options) {
            if (!element) return false;
			
            this.setOptions(options); //enregistre les options utilisateur

            var maduree = this.options.mooDuree;
            var matransition = this.options.mooTransition;
            var monease = this.options.mooEase;
            var useopacity = this.options.useOpacity;
            var dureeout = this.options.dureeOut;
            var menuID = this.options.menuID;
            var testoverflow = this.options.testoverflow;
            var orientation = this.options.orientation;
            var opentype = this.options.opentype;
            var style = this.options.style;
            var direction = this.options.direction;
            var directionoffset1 = this.options.directionoffset1;
            var directionoffset2 = this.options.directionoffset2;

            var els = element.getElements('li.maximenuCK');

            els.each(function(el) {
										
                if (el.getElement('div.floatCK') != null) {
                    el.conteneur = el.getElement('div.floatCK');
                    el.slideconteneur = el.getElement('div.maxidrop-main');
						
                    el.conteneurul = el.getElements('div.floatCK ul');
                    el.conteneurul.setStyle('position','static');

                    if (direction =='inverse') {
                        if (orientation =='0') {
                            if (el.hasClass('level0')) {
                                el.conteneur.setStyle('bottom',directionoffset1+'px');
                            } else {
                                el.conteneur.setStyle('bottom',directionoffset2+'px');
                            }
                        } else {
                            if (el.hasClass('level0')) {
                                el.conteneur.setStyle('right',directionoffset1+'px');
                            } else {
                                el.conteneur.setStyle('right',directionoffset2+'px');
                            }
                        }
                    }
						
                    el.conteneur.mh = el.conteneur.clientHeight;
                    el.conteneur.mw = el.conteneur.clientWidth;
                    el.duree = maduree;
                    el.transition = matransition;
                    el.ease = monease;
                    el.useopacity = useopacity;
                    el.orientation = orientation;
                    el.opentype = opentype;
                    el.direction = direction;
                    el.zindex = el.getStyle('z-index');
                    el.createFxMaxiCK();

                    if (style == 'clickclose') {
                        el.addEvent('mouseenter',function() {

                            if (testoverflow == '1') this.testOverflowMaxiCK(menuID);
                            if (el.hasClass('level0') && el.hasClass('parent') && el.status != 'show') {
                                els.each(function(el2){
                                    if (el2.status == 'show') {
                                        //el2.getElement('div.floatCK').setStyle('height','0');
                                        element.getElements('div.floatCK').setStyle('left','-999em');
                                        el2.status = 'hide';
                                    }
                                });

                            }
                            this.showMaxiCK();

                        });

                        el.getElement('.maxiclose').addEvent('click',function() {
                            el.hideMaxiCK();
                        });

                    } else if (style == 'click') {

                        var levels = ["level0", "level1", "level2", "level3", "level4"];

                        if (el.hasClass('parent') && el.getFirst('a.maximenuCK')) el.getFirst('a.maximenuCK').setProperty('href','javascript:void(0)');

                        el.getElement('span.titreCK').addEvent('click',function() {

                            if (testoverflow == '1') this.testOverflowMaxiCK(menuID);
                            if (el.status == 'show') {
                                el.hideMaxiCK();
                            } else {
                                levels.each(function(level){

                                if (el.hasClass(level) && el.hasClass('parent') && el.status != 'show') {

                                    els.each(function(el2){
                                        if (el2.status == 'show' && el2.hasClass(level)) {
                                            //el2.getElement('div.floatCK').setStyle('height','0');
                                            element.getElements('li.'+level+' div.floatCK').setStyle('left','-999em');
                                            el2.status = 'hide';
                                        }
                                    });

                                }
                                }); // fin de boucle level.each
                                el.showMaxiCK();
                            }

                        });

                    } else {
                        el.addEvent('mouseover',function() {

                            if (testoverflow == '1') this.testOverflowMaxiCK(menuID);
                            this.showMaxiCK();

                        });

                        el.addEvent('mouseleave',function() {

                            this.hideMaxiCK(dureeout);

                        });
                    }
                    
                }
            });
        }
			
    });

    if (MooTools.version > '1.12' ) Element.extend = Element.implement;

       
    Element.extend({

        testOverflowMaxiCK: function(menuID) {
            var limite = document.getElement('#'+menuID).offsetWidth + document.getElement('#'+menuID).getLeft();


            if (this.hasClass('parent')) {
                var largeur = this.conteneur.mw + 180;
                if (this.hasClass('level0')) largeur = this.conteneur.mw;

                var positionx = this.getLeft() + largeur;

                if (positionx > limite) {
                    this.getElement('div.floatCK').addClass('fixRight');
                    this.setStyle('z-index','15000');
                }
				
            }

        },

               
        createFxMaxiCK: function() {
			
            var myTransition = new Fx.Transition(Fx.Transitions[this.transition][this.ease]);
            if (this.hasClass('level0') && this.orientation != '1')
            {
                if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse')) {
                    this.maxiFxCK2 = new Fx.Tween(this.slideconteneur, {
                    property: 'margin-top',
                    duration:this.duree,
                    transition: myTransition
                    });
                    this.maxiFxCK2.set(-this.conteneur.mh);
                }
                this.maxiFxCK = new Fx.Tween(this.conteneur, {
                    property:'height',
                    duration:this.duree,
                    transition: myTransition
                });
                this.maxiFxCK.set(0);
            } else {
                if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse')) {
                    this.maxiFxCK2 = new Fx.Tween(this.slideconteneur, {
                    property: 'margin-left',
                    duration:this.duree,
                    transition: myTransition
                    });

                    this.maxiFxCK2.set(this.conteneur.mw);
                }
                this.maxiFxCK = new Fx.Tween(this.conteneur, {
                    property:'width',
                    duration:this.duree,
                    transition: myTransition
                });
                this.maxiFxCK.set(0);
            }

            if (this.useopacity == '1') {
                this.maxiOpacityCK = new Fx.Tween(this.conteneur, {
                    property: 'opacity', 
                    duration:this.duree
                });
                this.maxiOpacityCK.set(0);
            }
            

            
            
            this.conteneur.setStyle('left', '-999em');
				
            animComp = function(){
                if (this.status == 'hide')
                {
                    this.conteneur.setStyle('left', '-999em');
                    this.hidding = 0;
                    this.setStyle('z-index',this.zindex);
                    if (this.opentype == 'slide' && this.hasClass('level0') && this.orientation != '1') this.slideconteneur.setStyle('margin-top','0');
                    if (this.opentype == 'slide' && (!this.hasClass('level0') || this.orientation != '1')) this.slideconteneur.setStyle('margin-left','0');

                }
                this.showing = 0;
                this.conteneur.setStyle('overflow', '');
					
            }
            this.maxiFxCK.addEvent ('onComplete', animComp.bind(this));
            if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse')) this.maxiFxCK2.addEvent ('onComplete', animComp.bind(this));

        },
			
        showMaxiCK: function() {
            clearTimeout (this.timeout);
            this.addClass('sfhover');
            this.status = 'show';
            this.animMaxiCK();
        },
			
        hideMaxiCK: function(timeout) {
            this.status = 'hide';
            this.removeClass('sfhover');
            clearTimeout (this.timeout);
            if (timeout)
            {
                this.timeout = setTimeout (this.animMaxiCK.bind(this), timeout);
            }else{
                this.animMaxiCK();
            }
        },

        animMaxiCK: function() {

            if ((this.status == 'hide' && this.conteneur.style.left != 'auto') || (this.status == 'show' && this.conteneur.style.left == 'auto' && !this.hidding) ) return;
					
            this.conteneur.setStyle('overflow', 'hidden');
            if (this.status == 'show') {
                this.hidding = 0;
            }
            if (this.status == 'hide')
            {
                this.hidding = 1;
                this.showing = 0;
                this.maxiFxCK.cancel();
                if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse'))
                    this.maxiFxCK2.cancel();
					
                if (this.hasClass('level0') && this.orientation != '1') {
                    this.maxiFxCK.start(this.conteneur.offsetHeight,0);
                    if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse')) {
                        this.maxiFxCK2.start(0,-this.conteneur.offsetHeight);
                    } 
                } else {
                    this.maxiFxCK.start(this.conteneur.offsetWidth,0);
                    if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse')) {
                        this.maxiFxCK2.start(0, -this.conteneur.offsetWidth);
                    } 
                }
                if (this.useopacity == '1') {
                    this.maxiOpacityCK.cancel();
                    this.maxiOpacityCK.start(1,0);
                }
                

            } else {
                this.showing = 1;
                this.conteneur.setStyle('left', 'auto');
                this.maxiFxCK.cancel();
                if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse'))
                    this.maxiFxCK2.cancel();
                if (this.hasClass('level0') && this.orientation != '1') {
                    this.maxiFxCK.start(this.conteneur.offsetHeight,this.conteneur.mh);
                   if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse')) {
                        this.maxiFxCK2.start(-this.conteneur.mh,0);
                    } 
                } else {
                    this.maxiFxCK.start(this.conteneur.offsetWidth,this.conteneur.mw);
                    if ((this.opentype == 'slide' && this.direction == 'normal') || (this.opentype == 'open' && this.direction == 'inverse')) {
                        this.maxiFxCK2.start(-this.conteneur.mw,0);
                    }
                }
                if (this.useopacity == '1') {
                    this.maxiOpacityCK.cancel();
                    this.maxiOpacityCK.start(0,1);
                }
                
            }
				

        }
    });

    DropdownMaxiMenu.implement(new Options); //ajoute les options utilisateur � la class

		
/*Window.onDomReady(function() {new DropdownMenu($E('ul.maximenuCK'),{
                  //mooTransition : 'Quad',
			               //mooTransition : 'Cubic',
			               //mooTransition : 'Quart',
			               //mooTransition : 'Quint',
			               //mooTransition : 'Pow',
			               //mooTransition : 'Expo',
			               //mooTransition : 'Circ',
			               mooTransition : 'Sine',
			               //mooTransition : 'Back',
			               //mooTransition : 'Bounce',
			               //mooTransition : 'Elastic',

			               mooEase : 'easeIn',
                                       //mooEase : 'easeOut',
                                       //mooEase : 'easeInOut',
                                       
                                       mooDuree : 500
                                       })
                                       });*/

}