(function () {

  // var filteredTickets = [1, 2, 3, 4];

  return {

    // Welcome to the Suspended Ticket Nuke App, have a look around.

    requests: {

      deleteIt: function(filteredTickets) {

        var bar = filteredTickets;

        return {
          url: '/api/v2/suspended_tickets/destroy_many.json?ids=' + bar,
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

    events: {

      // Lifecycle Events
      'app.created': 'init',
      'hidden .my_modal': 'afterHidden',
      
      // AJAX Events & Callbacks
      'fetchTickets.done':'filterResults',
      'fetchTickets.fail':'fetchTicketsFail',
      
      // DOM Events
      'click .get-suspended-tickets': 'fetch',
      'click button.button-submit': 'processInputValue', // This is confirming the value you entered matches then sending request(s) to delete suspended tickets w the relevant IDs
      'keyup #inputValueId': function(event){
        if(event.keyCode === 13)
          return this.processInputValue();
      }

    },

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

    },

    afterHidden: function () {
      console.log("Modal closed");
    },

    deleteResults: function(filteredTickets) { // This function handles the IDs sending AJAX request for every 100 IDs
      
      this.switchTo('loading2');
      // services.notify('Completing your request');

      // You can only send 100 IDs per request to ~/api/v2/suspended_tickets/destroy_many.json?ids={id1},{id2},{id3},{etc}
      // Below only sends a single request for up to the first 100 - what about 101+?

      // just send first 2 from total array, then next 2 then next 2 etc

      // if array larger than 100, slice 100 out of it and send AJAX request w that 100
      // keep going until the array is smaller than 100 and send the rest

      while (filteredTickets.length > 0) {
        
        if ( filteredTickets.length > 2 ) {
          
          var batch = filteredTickets.slice(0, 2);

          filteredTickets.pop(batch);
          
          console.log(batch);
          console.log(batch.length);

          this.ajax('deleteIt', batch)
            .done( function() {
              this.switchTo('nuke');
            })
            .fail( function() { 
              console.log('failed')
            }
          );

        } else {

          console.log('this array has 3 or less items in it');
          console.log(filteredTickets.length);

          this.ajax('deleteIt', filteredTickets)
            .done( function() {
              this.switchTo('nuke');
            })
            .fail( function() { 
              console.log('failed')
          });

          return false;

        }

      }

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

      if( next_page ) { // Keep sending AJAX requests until all pages of results obtained

        console.log('there are more pages of results');

        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);
        this.ajax('fetchTickets', next_page);

      } else if ( !previous_page && !next_page ) { // Only 1 page of results 

        console.log('there is 1 page of results');

        this.suspended_tickets = data.suspended_tickets;

        var allTickets = this.suspended_tickets,
            finalTicketCount = data.count,
            filteredTickets = [];

        for (var i = 0; allTickets.length > i; i++ ) {
          if (_.contains(this.blacklist_map, allTickets[i].cause)) {
            console.log(allTickets[i].id); // The ID of a ticket with a cause = to a cause w true in app settings
            console.log(allTickets[i].cause);
            filteredTickets.push(allTickets[i].id);
          }
        };

        console.log('Here are all tickets with a cause matching a checked cause in current app setting configuration: ');
        console.log(filteredTickets);

        if (filteredTickets.length > 0) {
          this.switchTo('modal2', {
            finalTicketCount: finalTicketCount,
            filteredTickets: filteredTickets.length
          });
        } else {
          this.switchTo('nothingToDelete');
        }

        // Anchoring 'filteredTickets' & 'finalTicketCount' too app at the root 'this'
        this.filteredTickets = filteredTickets;
        this.finalTicketCount = finalTicketCount;

      } else { // Execute code once final page of results obtained

        console.log('there was more than 1 page - now all pages are obtained');

        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);

        var allTickets        = this.suspended_tickets,
            finalTicketCount  = data.count,
            filteredTickets = [];

        for (var i = 0; allTickets.length > i; i++ ) {
          if (_.contains(this.blacklist_map, allTickets[i].cause)) {
            console.log(allTickets[i].id); // The ID of a ticket with a cause = to a cause w true in app settings
            console.log(allTickets[i].cause);
            filteredTickets.push(allTickets[i].id);
          }
        };

        console.log('Here are all ticket IDs with a cause matching a checked cause in current app setting configuration: ');
        console.log(filteredTickets);

        if (filteredTickets.length > 0) {
          this.switchTo('modal2', {
            finalTicketCount: finalTicketCount,
            filteredTickets: filteredTickets.length
          });
        } else {
          this.switchTo('nothingToDelete');
        }

        // Anchoring 'filteredTickets' & 'finalTicketCount' too app at the root 'this'
        this.filteredTickets = filteredTickets;
        this.finalTicketCount = finalTicketCount;

      }
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    processInputValue: function() {

      var allTickets          = this.suspended_tickets, // All suspended tickets returned from every page of results
          filteredTickets     = this.filteredTickets, // All suspended ticket IDs if cause = any app parameter cause that is TRUE
          finalTicketCount    = this.finalTicketCount, // Number of total suspended tickets in the account
          filteredTicketsSize = filteredTickets.length, // Number of total suspended tickets matched and queued for deletion
          result              = this.$('input#inputValueId').val();

      if (result == filteredTickets.length ) {

        this.$('.my_modal').modal('hide');
        this.$('#inputValueId').val('');

        this.deleteResults(filteredTickets); // Pass filtered results of all matching IDs to the deleteResults function for handling

      } else {

        this.$('.my_modal').modal('hide');
        this.$('#inputValueId').val('');
        services.notify('You entered ' + result + ' - to delete the suspended tickets please enter ' + filteredTicketsSize, 'alert');

      }
    }

  };

}());

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