(function () {

  return {

    requests: {

      fetchTickets: function(next_page) {
        return {
          url: next_page || '/api/v2/suspended_tickets.json',
          type: 'GET'
        };
      },

      getUsers: function() {
        return {
          url: '/api/v2/users.json',
          type: 'GET'
        };
      }

    },

    events: {

      // Lifecycle Events
      'app.created': 'init',
      'hidden .my_modal': 'afterHidden',
      
      // AJAX Events & Callbacks
      'fetchTickets.done':'filterResults',
      'fetchTickets.fail':'fetchTicketsFail',
      'getUsers.done': 'getUsersDone',
      'getUsers.fail': 'getUsersFail',
      
      // DOM Events
      'click .close_button': 'cancelButton',
      'click .save_button': 'saveButton',
      'click .count_button': 'fetch',
      'click button.search': 'getSearch'

    },

    init: function () {
      this.switchTo('modal');
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

        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);
        this.ajax('fetchTickets', next_page);



      } else if ( !previous_page && !next_page ) {  



      // Only 1 page of results



        this.suspended_tickets = data.suspended_tickets;

        var allTickets = this.suspended_tickets;

        console.log(allTickets);
        console.log('Below is an array of an array of objects containing just the { key : value } pairs for \'id\' & \'status\'');
        
        var allTicketsIdAndStatusOnly = _.chain(allTickets).flatten(true).map( // Thanks to https://github.com/dpawluk for this line of underscore magic
          function( x ){ 
            return _.pick( x , 'id', 'cause'); // I sorted out this little underscore piece - go me!
          }).value();

        console.log(allTicketsIdAndStatusOnly);
        console.log('below should be only status pending???');
        
        var justPending = _.filter(allTicketsIdAndStatusOnly, function( tkt ) { // This simplified version courtesy of one https://github.com/jstjoe
            return tkt.cause == 'Automated response email, delivery failed'; //  || tkt.status == 'open'
          });
        console.log(justPending);

        
        var finalTicketCount = data.count;

        this.switchTo('modal2', {
          finalTicketCount: finalTicketCount,
          justPending: justPending.length
        });

        this.allTicketsIdAndStatusOnly = allTicketsIdAndStatusOnly;
        this.justPending = justPending;
        this.finalTicketCount = finalTicketCount;

        // this.ajax('myDeleteAJAXRequest'); send 100 IDs per request to bulk delete       

        console.log('**START** DATA FROM F(X) \'filterResults\'');

        console.log(allTickets);
        console.log(allTicketsIdAndStatusOnly);
        console.log('****** JUST PENDING - start ****');
        console.log(justPending);
        console.log('****** JUST PENDING - end ****');
        console.log(finalTicketCount);

        console.log('**END** DATA FROM F(X) \'filterResults\'');

        

      } else { 



      // After retrieving last page of multiple pages of results



        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);

        var allTickets = this.suspended_tickets;

        console.log(allTickets);
        console.log('Below is an array of an array of objects containing just the { key : value } pairs for \'id\' & \'status\'');
        
        var allTicketsIdAndStatusOnly = _.chain(allTickets).flatten(true).map( // Thanks to https://github.com/dpawluk for this line of underscore magic
          function( x ){ 
            return _.pick( x , 'id', 'cause'); // I sorted out this little underscore piece - go me!
          }).value();

        console.log(allTicketsIdAndStatusOnly);
        console.log('below should be only status pending???');
        
        var justPending = _.filter(allTicketsIdAndStatusOnly, function( tkt ) { // This simplified version courtesy of one https://github.com/jstjoe
            return tkt.cause == 'Automated response email, delivery failed'; //  || tkt.status == 'open'
          });
        console.log(justPending);

        
        var finalTicketCount = data.count;

        this.switchTo('modal2', {
          finalTicketCount: finalTicketCount,
          justPending: justPending.length
        });

        this.allTicketsIdAndStatusOnly = allTicketsIdAndStatusOnly;
        this.justPending = justPending;
        this.finalTicketCount = finalTicketCount;

        // this.ajax('myDeleteAJAXRequest'); send 100 IDs per request to bulk delete       

        console.log('**START** DATA FROM F(X) \'filterResults\'');

        console.log(allTickets);
        console.log(allTicketsIdAndStatusOnly);
        console.log('****** JUST PENDING - start ****');
        console.log(justPending);
        console.log('****** JUST PENDING - end ****');
        console.log(finalTicketCount);

        console.log('**END** DATA FROM F(X) \'filterResults\'');

      }
    },

    getSearch: function() {

      var allTickets = this.suspended_tickets;
      var allTicketsIdAndStatusOnly = this.allTicketsIdAndStatusOnly;
      var justPending = this.justPending;
      var finalTicketCount = this.finalTicketCount;

      console.log('**START** DATA FROM F(X) \'getSearch\'');

      console.log(allTickets);
      console.log(allTicketsIdAndStatusOnly);
      console.log(justPending);
      console.log(finalTicketCount);

      console.log('**END** DATA FROM F(X) \'getSearch\'');

      var result = this.$('input#searchString').val();

      if (result == justPending.length ) {

        this.$('.my_modal').modal('hide');
        this.$('#searchString').val('');
        this.switchTo('loading2');
        services.notify('Number entered matches the Pending ticket count - sending ~/users.json request', 'notice');
        
        this.ajax('getUsers'); // This would be sending the batches of 100 ids to the ~/api/v2/suspended_tickets/destroy_many.json?ids={id1},{id2}

      } else {

        this.$('.my_modal').modal('hide');
        this.$('#searchString').val('');
        services.notify('Number entered doesn\'t match the Pending ticket count', 'error');

      }
    },

    getUsersDone: function(data) {
      var results = data.count;
      services.notify('getUsers success', 'notice');
      this.switchTo('nuke', {
        results: results
      });
    },

    getUsersFail: function() {
      services.notify('getUsers failed request', 'error');
    },

    saveButton: function() {

      console.log('.save_button element clicked');
      // this.switchTo('loading2');

    }

  };

}());
