/**
 * @copyright	Copyright (C) 2010 Cédric KEIFLIN alias ced1870
 * http://www.ck-web-creation-alsace.com
 * http://www.joomlack.fr
 * Module Maximenu_CK for Joomla!
 * @license		GNU/GPL
 * */

var SlideList = new Class({
    Implements: Options,
    options: {    //options par défaut si aucune option utilisateur n'est renseignée

        fancyTransition : 'Bounce',
        fancyEase : 'easeOut',
        fancyDuree : 500
    },
        
    initialize: function(menu, options) {
        if (!menu) return false;

        this.setOptions(options); //enregistre les options utilisateur

        // store options
        var fancyduree = this.options.fancyDuree;
        var fancyease = this.options.fancyEase;
        var fancytrans = this.options.fancyTransition;
        var fancytransition = new Fx.Transition(Fx.Transitions[this.options.fancyTransition][this.options.fancyEase])


        if (!menu.getElement('.active')) {
            menu.getElements('li.level0').each(function(el){
                el.addEvent('mouseover',function() {

                    if (!menu.getElement('li.hoverbgactive')) {
                        el.addClass('hoverbgactive');
                        new SlideList(menu,{fancyTransition : fancytrans,fancyEase : fancyease,fancyDuree : fancyduree});
                    }

                    //this.current = this;

                });
            });
        }

        // if no active element in the menu, get out
        if (!menu.getElement('.active') && !menu.getElement('.hoverbgactive')) return false;

        this.current = menu.getElement('li.hoverbgactive') || menu.getElement('li.active');
		
        menu.getElements('li').each(function(item){
            item.addEvent('mouseover', function(){
                this.moveBg(item);
            }.bind(this));
            item.addEvent('mouseout', function(){
                if (menu.getElement('li.active')) {
                    this.moveBg(this.current);
                } else {
                    this.back.morph({
                        left: 0,
                        width: 0
                    });
                }
            }.bind(this));
            item.addEvent('click', function(event){
                this.clickItem(event, item);
            }.bind(this));
        }.bind(this));
				
        this.back = new Element('li').addClass('maxiFancybackground').adopt(new Element('div').addClass('maxiFancycenter').adopt(new Element('div').addClass('maxiFancyleft')).adopt(new Element('div').addClass('maxiFancyright'))).injectInside(menu);
        this.back.set('morph', {duration: fancyduree, transition: fancytransition});

        if(this.current) this.setCurrent(this.current);
    },
	
    setCurrent: function(el, effect){
        this.back.morph({
            left: (el.offsetLeft)+'px',
            width: (el.offsetWidth)+'px'
            });
        (effect) ? this.back.effect('opacity').set(0).start(1) : this.back.setOpacity(1);
        this.current = el;
    },

    clickItem: function(event, item) {
        if(!this.current) this.setCurrent(item, true);
        this.current = item;
        //this.options.onClick(new Event(event), item);
    },

    moveBg: function(to) {
        if(!this.current) return;
        this.back.morph({
            left:  [this.back.offsetLeft, to.offsetLeft],
            width: [this.back.offsetWidth, to.offsetWidth]
        });

           
    }
});

SlideList.implement(new Options);

/*window.addEvent('domready', function() {
	// orange menu demo
	if($('fancymenu'))
		FancyExample = new SlideList($E('ul', 'fancymenu'), {transition: Fx.Transitions.backOut, duration: 700, onClick: function(ev, item) { ev.stop(); }});
	
	// profile demo
	if($('pictureselect')) PictureSelect = new SlideList('pictureselect', { onClick: function(ev, item) { ev.stop(); } });

});*/