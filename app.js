(function () {

  return {

    // Welcome to the Suspended Ticket Nuke App, have a look around.

    requests: {

      deleteIt: function() { // deleteIt: function(foo) {
        // var suspendedTicketIds = foo.split(',');
        return {
          url: '/api/v2/suspended_tickets/destroy_many.json?ids=', // + suspendedTicketIds, 
          // URL format     ~/destroy_many.json?ids=11,22,33 where 11,22,33 are comma separated integers
          type: 'DELETE'
        };
      },

      fetchTickets: function(next_page) {
        return {
          url: next_page || '/api/v2/suspended_tickets.json',
          type: 'GET'
        };
      }

    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>
    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>
    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    events: {

      // Lifecycle Events
      'app.created': 'init',
      'hidden .my_modal': 'afterHidden',
      
      // AJAX Events & Callbacks
      'fetchTickets.done':'filterResults',
      'fetchTickets.fail':'fetchTicketsFail',
      
      // DOM Events
      'click .close_button': 'cancelButton',
      'click .count_button': 'fetch',
      'click button.search': 'getSearch',
      'keyup #searchString': function(event){
        if(event.keyCode === 13)
          return this.getSearch();
      }

    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>
    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>
    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    init: function () {

      this.switchTo('modal');

      this.blacklist_map = []; // build array of substrings containing causes of suspension
      
      if (this.setting('\"Email is from a blacklisted sender or domain\"') === true) {
        this.blacklist_map.push("Email is from a blacklisted sender or domain");
      }
      if (this.setting('\"Email for \"noreply\" address\"') === true) {
        this.blacklist_map.push("Email for \"noreply\" address");
      }
      if (this.setting('\"Automated response email, out of office\"') === true) {
        this.blacklist_map.push("Automated response email, out of office");
      }
      if (this.setting('\"Received from Support Address\"') === true) {
        this.blacklist_map.push("Received from Support Address");
      }
      if (this.setting('\"Detected as email loop\"') === true) {
        this.blacklist_map.push("Detected as email loop");
      }
      if (this.setting('\"Automatic email processing failed\"') === true) {
        this.blacklist_map.push("Automatic email processing failed");
      }
      if (this.setting('\"Detected as spam\"') === true) {
        this.blacklist_map.push("Detected as spam");
      }
      if (this.setting('\"Submitted by registered user while logged out\"') === true) {
        this.blacklist_map.push("Submitted by registered user while logged out");
      }
      if (this.setting('\"Automated response email, delivery failed\"') === true) {
        this.blacklist_map.push("Automated response email, delivery failed");
      }
      if (this.setting('\"Automated response email\"') === true) {
        this.blacklist_map.push("Automated response email");
      }
      if (this.setting('\"Detected email as being from a system user\"') === true) {
        this.blacklist_map.push("Detected email as being from a system user");
      }
      console.log(this.blacklist_map);

    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    afterHidden: function () {
      console.log("Modal closed");
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    cancelButton: function() {
      console.log('.cancel_button element clicked');
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    deleteResults: function(suspended) {
      // console.log('To be deleted: ' + suspended.toString());
      // var map = this.blacklist_map;
      // var mailFail = _.filter(suspended, function(item){
      //       return map.indexOf(item.cause) > -1;
      //   });
      //   _.each(mailFail, _.bind(function(item) {
      //       this.ajax('deleteIt', item.id);
      //       console.log('Attempted to delete suspended ticket ' + item.id);
      //   }, this));

      // this.switchTo('nuke');
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>
    
    fetch: function() {
      this.tickets = [];
      this.ajax('fetchTickets');
      this.switchTo('loading');
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    fetchTicketsFail: function(response) {
      services.notify('Oops... something went wrong when fetching the Suspended Tickets.');
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    filterResults: function(data) {

      var next_page = data.next_page,
          previous_page = data.previous_page;

      if( next_page ) { 
      // If there are more pages left to request data from

        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);
        this.ajax('fetchTickets', next_page);

        //**************************************************

      } else if ( !previous_page && !next_page ) {  
      // Only 1 page of results 

        this.suspended_tickets = data.suspended_tickets;

        var allTickets = this.suspended_tickets,
            finalTicketCount = data.count;

        console.log('\'allTickets below\'');
        console.log(allTickets);
        console.log(allTickets.length);

        console.log('***$%$%$%$%$%$%$%$%*****');

        console.log('Below is an array of an array of objects containing just the { key : value } pairs for \'id\' & \'cause\'');
        
        var allTicketsFiltered = _.chain(allTickets).flatten(true).map(
          function( x ){ 
            return _.pick( x , 'id', 'cause');
          }).value();

        console.log('\'allTicketsFiltered\' below');
        console.log(allTicketsFiltered);
        console.log(allTicketsFiltered.length);

        console.log('***$%$%$%$%$%$%$%$%*****');
        
        var idAndCause = _.filter(allTicketsFiltered, function( tkt ) {
            // return tkt.cause == 'Automated response email' || 'Automated response email, delivery failed' || 'Automated response email, out of office' || 'Automatic email processing failed' || 'Detected as email loop' || 'Detected as spam' || 'Detected email as being from a system user' || 'Email for \'noreply\' address\'' || 'Email is from a blacklisted sender or domain' || 'Received from Support Address' || 'Submitted by registered user while logged out' ; //  || tkt.status == 'open'
            return tkt.cause == 'Submitted by registered user while logged out' ;
          });

        console.log('idAndCause which is only the cause ' + ' \'Submitted by registered user while logged out\''); // Will only include settings with 'true' values
        console.log(idAndCause);
        console.log(idAndCause.length);

        console.log('***$%$%$%$%$%$%$%$%*****');

        if (idAndCause.length > 0) {
          this.switchTo('modal2', {
            finalTicketCount: finalTicketCount,
            idAndCause: idAndCause.length
          });

          // this.deleteResults(this.suspended_tickets); // send 100 IDs per request to bulk delete 

        } else {
          this.switchTo('nothingToDelete');
        }

        this.allTicketsFiltered = allTicketsFiltered;
        this.idAndCause = idAndCause;
        this.finalTicketCount = finalTicketCount;

        console.log('Total suspended tickets: ');
        console.log(finalTicketCount);

        //**************************************************

      } else { 
      // After retrieving last page of multiple pages of results

        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);

        var allTickets = this.suspended_tickets;

        console.log(allTickets);
        console.log('Below is an array of an array of objects containing just the { key : value } pairs for \'id\' & \'status\'');
        
        var allTicketsFiltered = _.chain(allTickets).flatten(true).map( // Thanks to https://github.com/dpawluk for this line of underscore magic
          function( x ){ 
            return _.pick( x , 'id', 'cause'); // I sorted out this little underscore piece - go me!
          }).value();

        console.log(allTicketsFiltered);
        console.log('Below is allTickets but only id & cause key:value pairs:');
        
        var idAndCause = _.filter(allTicketsFiltered, function( tkt ) { // This simplified version courtesy of one https://github.com/jstjoe
            return tkt.cause == 'Submitted by registered user while logged out' ;
          });
        console.log(idAndCause);
        
        var finalTicketCount = data.count;

        this.switchTo('modal2', {
          finalTicketCount: finalTicketCount,
          idAndCause: idAndCause.length
        });

        this.allTicketsFiltered = allTicketsFiltered;
        this.idAndCause = idAndCause;
        this.finalTicketCount = finalTicketCount;

        console.log('**START** DATA FROM F(X) \'filterResults\'');

        console.log(allTickets);
        console.log(allTicketsFiltered);
        console.log('****** JUST PENDING - start ****');
        console.log(idAndCause);
        console.log('****** JUST PENDING - end ****');
        console.log(finalTicketCount);

        console.log('**END** DATA FROM F(X) \'filterResults\'');

      }
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    getSearch: function() {

      var allTickets = this.suspended_tickets;
      var allTicketsFiltered = this.allTicketsFiltered;
      var idAndCause = this.idAndCause;
      var finalTicketCount = this.finalTicketCount;

      console.log('**START** DATA FROM F(X) \'getSearch\'');

      console.log(allTickets);
      console.log(allTicketsFiltered);
      console.log(idAndCause);
      console.log(finalTicketCount);

      console.log('**END** DATA FROM F(X) \'getSearch\'');

      var result = this.$('input#searchString').val();

      if (result == idAndCause.length ) {

        this.$('.my_modal').modal('hide');
        this.$('#searchString').val('');
        this.switchTo('loading2');
        services.notify('Completing your request, one moment please', 'notice');
        
        // this.deleteResults(this.suspended_tickets); // send 100 IDs per request to bulk delete 
        
        //**************************************************

      } else {

        this.$('.my_modal').modal('hide');
        this.$('#searchString').val('');
        services.notify('Values don\'t match', 'error');

        //**************************************************

      }
    }

  };

}());

// So wait, is this like the end of the movie after the credits where there are the outtakes?
//
//
//
// 
//            * * * Suspended Ticket Nuke App * * *
// 
//
//                      __,-~~/~    `---.
//                    _/_,---(      ,    )
//                __ /        <    /   )  \___
// - ------===;;;'====------------------===;;;===----- -  -
//                   \/  ~"~"~"~"~"~\~"~)~"/
//                   (_ (   \  (     >    \)
//                    \_( _ <         >_>'
//                       ~ `-i' ::>|--"
//                           I;|.|.|
//                          <|i::|i|`.
//                         (` ^'"`-' ")
// ------------------------------------------------------------------
//
//            * * * Suspended Ticket Nuke App * * *
//               It's a mushroom cloud - get it?
//
//
//
//
//