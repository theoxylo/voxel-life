(function ($) {

  var Item = Backbone.Model.extend({
    defaults: {
      linkText: 'link',
      href: './'
    }
  });
  
  var ItemView = Backbone.View.extend({
    tagName: 'li', // name of (orphan) root tag in this.el
    initialize: function(){
      _.bindAll(this, 'render');
    },
    render: function () {
      $(this.el).html('<li><a href="' + this.model.get('href') + '">' + this.model.get('linkText') + '</a></li>').hide().fadeIn();
      return this; // for chainable calls, like .render().el
    }
  });
  
  var List = Backbone.Collection.extend({
    model: Item
  });
  
  var ListView = Backbone.View.extend({    
    //el: $('#msg'),
    el: document.getElementById('msg'), // convert to jquery in render

    events: {
      'click button#addButton': 'addLink'
    },

    links: [],

    initialize: function () {
      _.bindAll(this, 'render', 'addLink', 'appendLink');
      this.collection = new List();
      this.collection.bind('add', this.appendLink); // collection event binder
      this.render();
      this.links.push(['Version 2', './index_v2.html']);
      this.links.push(['Version 3', './index_v3.html']);
    },

    render: function () {
        console.log('render called')
      var $el = $(this.el)
      $el.html("<button id='addButton'>Add Link</button>");
      $el.append("<ul></ul>");

      _(this.collection.models).each(function (item) { // in case collection is not empty
        this.appendLink(item);
      }, this);
    },

    addLink: function (event) {
      console.log('addLink arguments:')
      console.log(arguments)

      if (this.links.length) {
        var link = this.links.shift()
        text = link[0]
        url = link[1]

        var item = new Item();
        item.set({
          linkText: text,
          href: url
        });
        this.collection.add(item); // 'add' event will pass item to appendLink
      }
      else console.log('no more links to add')
    },
      
    appendLink: function (item) {
      var itemView = new ItemView({
        model: item
      });
      var $el = $('ul', this.el)
      $el.append(itemView.render().el);
    }

  });

  var listView = new ListView();      

})(jQuery);
