(function () {

  var globalVar = "GLOBAL_VARIABLE";

  return {

    requests: {

      fetchTickets: function(next_page) {
        return {
          url: next_page || '/api/v2/tickets.json',
          type: 'GET'
        };
      }

    },

    events: {

      'app.created': 'init',
      'hidden .my_modal': 'afterHidden', // https://developer.zendesk.com/apps/docs/agent/modals
      'click .count_button': 'fetch',
      'click .save_button': 'saveButton',
      'fetchTickets.done':'filterResults',
      'fetchTickets.fail':'fetchTicketsFail',
      'click .findPriority': 'findPriority',
      'click .close_button': 'cancelButton'
      // 'keyup .custom-search input': function(event){
      //   if(event.keyCode === 13)
      //     return this.processSearchFromInput();
      // },
      // 'click .custom-search button': 'processSearchFromInput'
    
    },

    init: function () {

      this.switchTo('modal', {
        header: this.I18n.t('modal_header'),
        body: this.I18n.t('modal_body'),
        globalVar: globalVar
      });

    },

    afterHidden: function () {
      console.log("Modal closed");
    },

    cancelButton: function() {
      console.log('.cancel_button element clicked');
    },

    fetch: function() {
      this.tickets = [];
      this.ajax('fetchTickets');
      this.switchTo('loading');
    },

    fetchTicketsFail: function(response) {
      services.notify('Oops... something went wrong when fetching the Suspended Tickets.');
    },

    filterResults: function(data) {

      var next_page = data.next_page,
          previous_page = data.previous_page;

      if( next_page ) { // If there are more pages left to request data from

        this.tickets = this.tickets.concat(data.tickets);
        this.ajax('fetchTickets', next_page);

      } else if ( !previous_page && !next_page ) {  // Only 1 page of results

        this.tickets = data.tickets;

        // this.ajax('myDeleteAJAXRequest'); - will go here :)

      } else { // After retrieving last page of multiple pages of results

        this.tickets = this.tickets.concat(data.tickets);

        // data manipulation testing start

        var allTickets = this.tickets;
        console.log(allTickets);

        console.log('Below is an array of an array of objects containing just the { key : value } pairs for \'id\' & \'status\'');

        var allTicketsIdAndStatusOnly = _.chain(allTickets).flatten(true).map( // Thanks to https://github.com/dpawluk for this line of underscore magic
          function( x ){ 
              return _.pick( x , 'id', 'status'); // I sorted out this little underscore piece - go me!
          }).value();
        
        console.log(allTicketsIdAndStatusOnly);

        console.log('below should be only status pending???');

        var justPending = _.filter(allTicketsIdAndStatusOnly, function(tkt) { // This simplified version courtesy of one https://github.com/jstjoe
         return tkt.status == 'pending';
        });

        console.log(justPending);

        // data manipulation testing end

        var finalTicketCount = data.count,
            globalVar = "LOCAL_VARIABLE";

        this.switchTo('modal2', {
          header: this.I18n.t('modal_header'),
          body: this.I18n.t('modal_body'),
          globalVar: globalVar,
          finalTicketCount: finalTicketCount
        });

        // this.ajax('myDeleteAJAXRequest'); - will go here :)

      }
    },

    // processSearchFromInput: function(){
    //   var query = this.removePunctuation(this.$('.custom-search input').val());
    //   if (query && query.length) { this.search(query); }
    // },

    findPriority: function() {

      this.switchTo('modal2', {
        header: this.I18n.t('modal_header'),
        body: this.I18n.t('modal_body'),
        globalVar: globalVar
      });

    },

    saveButton: function() {

      console.log('.save_button element clicked');
      this.switchTo('loading2');

    }

  };

}());
