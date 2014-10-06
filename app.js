(function () {

  var globalVar = "GLOBAL_VARIABLE";

  return {

    requests: {

      fetchTicketsRequest: function() {
        return {
          url: '/api/v2/tickets.json',
          type: 'GET',
          contentType: 'application/json'
        };
      },

      fetchTickets: function(next_page) {
        return { // Get all suspended tickets
          url: next_page || '/api/v2/tickets.json',
          type: 'GET',
          contentType: 'application/json'
        };
      }

    },

    events: {

      'app.created': 'init',
      'hidden .my_modal': 'afterHidden', // The 'hidden' event is fired when the modal (.my_modal) has finished being hidden from the user (will wait for css transitions to complete).
      'click .count_button': 'fetch',
      'click .save_button': 'saveButton',
      'fetchTickets.done':'filterResults',
      'fetchTickets.fail':'fetchTicketsFail',
      'click .findPriority': 'findPriority',
      'keyup .custom-search input': function(event){
        if(event.keyCode === 13)
          return this.processSearchFromInput();
      },
      'click .custom-search button': 'processSearchFromInput'
    
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

      if( next_page ) {
      // if there is another page -> concat results to global variable, call it again w/ next_page as URL
        this.tickets = this.tickets.concat(data.tickets);
        this.ajax('fetchTickets', next_page);
        console.log(data);
        console.log(this.tickets);
        console.log('1 + page(s) of results remaining to request.');
      } else if ( !previous_page && !next_page ) {  
      // if only page -> results are just this page, proceed to delete
        this.tickets = data.tickets;
        console.log(data);
        console.log(this.tickets);
        console.log('There\'s only 1 page of results - job done.');

        // this.deleteResults(this.suspended); // SEND DELETE API REQUEST

      } else {  
      // if last page -> concat results to global variable, proceed to delete

        console.log(' $$$ REQUESTS FOR PAGINATED RESULTS COMPLETE & DATA SET READY FOR MANIPULATION $$$ ');

        this.tickets = this.tickets.concat(data.tickets);

        console.log('Here are the results of all your requests to ~/tickets.json on the next line');
        console.log(this.tickets);

        var finalTicketCount = data.count;

        var globalVar = "LOCAL_VARIABLE";

        this.switchTo('modal2', {
          header: this.I18n.t('modal_header'),
          body: this.I18n.t('modal_body'),
          globalVar: globalVar,
          finalTicketCount: finalTicketCount
        });

        // this.deleteResults(this.suspended); // SEND DELETE API REQUEST

      }
    },

    processSearchFromInput: function(){
      var query = this.removePunctuation(this.$('.custom-search input').val());
      if (query && query.length) { this.search(query); }
    },

    findPriority: function() {

      this.switchTo('modal2', {
        header: this.I18n.t('modal_header'),
        body: this.I18n.t('modal_body'),
        globalVar: globalVar
      });

    },

    saveButton: function() {

      alert('you clicked CONFIRM in the modal2, now we will find data from your results - sit tight!');
      this.switchTo('loading2');

    }

  };

}());
