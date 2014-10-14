(function () {

  return {

    // Welcome to the Suspended Ticket Nuke App, have a look around.

    requests: {

      deleteIt: function(filteredTickets) { // The only or the remaining IDs from 'filteredTickets'
        return {
          url: '/api/v2/suspended_tickets/destroy_many.json?ids=' + filteredTickets,
          type: 'DELETE'
        };
      },

      deleteItBatch: function(batch) { // Sub-arrays of 'filteredTickets'
        return {
          url: '/api/v2/suspended_tickets/destroy_many.json?ids=' + batch,
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

    events: {

      // Lifecycle Events
      'app.created': 'init',
      
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

    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    deleteResults: function(filteredTickets) { // This function handles the IDs sending AJAX request for every 100 IDs

      this.switchTo('loading2');

      services.notify('Deleting ' + filteredTickets.length + ' suspended tickets.', 'notice');

      while (filteredTickets.length > 100) { // There are more than n tickets in filteredTickets - sending it in pieces to 'deleteItBatch'
        
        var batch = filteredTickets.splice(0, 100);
        
        this.ajax('deleteItBatch', batch) // Send this batch to 'deleteItBatch'
          .done(
            console.log('Batch of suspended tickets deleted successfully - while loop continues..')
          )
          .fail(
            console.log('Failed to delete **batch** of suspended tickets.')
          );

        console.log('These were deleted: ');
        console.log(batch);
        console.log('Here are the remaining IDs: ');
        console.log(filteredTickets);
      }

      if (filteredTickets.length <= 100) { // There are 2 or fewer IDs to delete so send filteredTickets to 'deleteIt'

        console.log('less than or equal to 2 tickets');

        this.ajax('deleteIt', filteredTickets) // Send this batch to 'deleteItBatch'
          .done( function() {
              console.log('Suspended tickets deleted successfully. Nothing else to delete.');
              this.switchTo('nuke');
              services.notify('All selected tickets have been deleted, thanks for waiting!');
          })
          .fail( function() { 
              console.log('Failed to delete suspended tickets.');
          });
      
      }

    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    fetch: function() {
      this.suspended_tickets = [];
      this.ajax('fetchTickets');
      this.switchTo('loading');
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    fetchTicketsFail: function(response) {
      services.notify('Oops... something went wrong when fetching the Suspended Tickets.');
      console.log(response);
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    filterResults: function(data) {

      var next_page = data.next_page,
          previous_page = data.previous_page;

      if( next_page ) { // Keep sending AJAX requests until all pages of results obtained

        this.ajax('fetchTickets', next_page);
        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);

      } else if ( !previous_page && !next_page ) { // Execute this code block if account has less than 101 suspended tickets
        
        // ********** ELSE IF start **********

        console.log('All suspended tickets retrieved - there was 1 page.');

        this.suspended_tickets = data.suspended_tickets;

        var allTickets = this.suspended_tickets,
            finalTicketCount = data.count,
            filteredTickets = [];

        for (var i = 0; allTickets.length > i; i++ ) {
          if (_.contains(this.blacklist_map, allTickets[i].cause)) {
            // console.log(allTickets[i].id); // The ID of a ticket with a cause = to a cause w true in app settings
            // console.log(allTickets[i].cause);
            filteredTickets.push(allTickets[i].id);
          }
        }

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

        // ********** ELSE IF end **********

      } else { // Execute this code block once final page of paginated results retrieved
        
        // ********** ELSE start **********

        console.log('All suspended tickets retrieved - there were 2+ pages.');

        this.suspended_tickets = this.suspended_tickets.concat(data.suspended_tickets);

        console.log(this.suspended_tickets);

        var allTickets        = this.suspended_tickets,
            finalTicketCount  = data.count,
            filteredTickets = [];

        for (var i = 0; allTickets.length > i; i++ ) {
          if (_.contains(this.blacklist_map, allTickets[i].cause)) {
            // console.log(allTickets[i].id); // The ID of a ticket with a cause = to a cause w true in app settings
            // console.log(allTickets[i].cause);
            filteredTickets.push(allTickets[i].id);
          }
        }

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

        // ********** ELSE end **********

      }
    
    },

    //<><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>

    processInputValue: function() {

      var allTickets          = this.suspended_tickets, // All suspended ticket objects returned for the account
          filteredTickets     = this.filteredTickets, // All suspended ticket IDs if cause = any app parameter cause that is TRUE
          finalTicketCount    = this.finalTicketCount, // Total count suspended tickets in entire account
          filteredTicketsSize = filteredTickets.length, // Number of total suspended tickets with cause matching a true checkbox in app settings
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