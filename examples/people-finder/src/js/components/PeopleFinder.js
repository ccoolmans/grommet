// (C) Copyright 2014-2015 Hewlett-Packard Development Company, L.P.

var merge = require('lodash/object/merge');
var React = require('react');
var App = require('grommet/components/App');
var IntlMixin = require('grommet/mixins/GrommetIntlMixin');
var Rest = require('grommet/utils/Rest');
var People = require('./People');
var Person = require('./Person');

var LDAP_BASE_PARAMS = {
  url: encodeURIComponent('ldap://ldap.hp.com'),
  base: encodeURIComponent('ou=people,o=hp.com'),
  scope: 'sub'
};

/*
 * The PeopleFinder module controls the browser location and interacts with the
 * back end. It uses the People and Person modules to handle all visualizations.
 */

var PeopleFinder = React.createClass({

  mixins: [IntlMixin],

  _pushState: function () {
    var label = this.getGrommetIntlMessage('People Finder');
    var url = window.location.href.split('?')[0];
    if (this.state.uid) {
      url += '?uid=' + encodeURIComponent(this.state.uid);
      label = this.state.uid;
    } else if (this.state.searchText) {
      url += '?search=' + encodeURIComponent(this.state.searchText);
      label = this.state.searchText;
    }
    window.history.pushState({}, label, url);
  },

  _onPeopleResponse: function (err, res) {
    if (err) {
      this.setState({people: [], error: err});
    } else if (res.ok) {
      var result = res.body;
      this.setState({people: result, error: null});
    }
  },

  _getPeople: function (searchText) {
    // debounce
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(function () {
      console.log('!!! PeopleFinder _getPeople', searchText);
      var filter;
      if (searchText[0] === '(') {
        // use as a raw filter
        filter = searchText;
      } else {
        filter = '(cn=*' + searchText + '*)';
      }
      var params = merge({}, LDAP_BASE_PARAMS, {
        filter: filter,
        attributes: ['cn', 'uid', 'hpPictureThumbnailURI', 'hpBusinessUnit']
      });
      Rest.get('/ldap/', params).end(this._onPeopleResponse);
    }.bind(this), 500);
  },

  _onSearchText: function (text) {
    this.setState({initial: (! text), searchText: text}, this._pushState);
    if (! text) {
      this.setState({people: []});
    } else {
      this._getPeople(text);
    }
  },

  _onPersonResponse: function (err, res) {
    if (err) {
      this.setState({person: {}, error: err});
    } else if (res.ok) {
      var result = res.body;
      this.setState({person: result[0], error: null});
    }
  },

  _getPerson: function (uid) {
    var params = merge({}, LDAP_BASE_PARAMS, {
      filter: '(uid=' + uid + ')'
    });
    Rest.get('/ldap/', params).end(this._onPersonResponse);
  },

  _onSelectPerson: function (person) {
    this.setState({uid: person.uid, person: {}}, this._pushState);
    this._getPerson(person.uid);
  },

  _onClosePerson: function () {
    this.setState({uid: null, person: {}}, this._pushState);
  },

  getInitialState: function () {
    var url = window.location.href;

    var searchText = '';
    var parts = url.split('?search=');
    if (parts.length > 1) {
      searchText = decodeURIComponent(parts[1]);
    }

    var uid = null;
    parts = url.split('?uid=');
    if (parts.length > 1) {
      uid = decodeURIComponent(parts[1]);
    }

    return {
      initial: (! searchText),
      searchText: searchText,
      people: [],
      uid: uid,
      person: {}
    };
  },

  componentDidMount: function () {
    if (this.state.searchText) {
      this._getPeople(this.state.searchText);
    }
    if (this.state.uid) {
      this._getPerson(this.state.uid);
    }
  },

  componentDidUnmount: function () {
    clearTimeout(this._searchTimer);
  },

  render: function() {
    var contents;
    if (this.state.uid) {
      contents = (
        <Person uid={this.state.uid} person={this.state.person}
          onClose={this._onClosePerson} onSelect={this._onSelectPerson} />
      );
    } else {
      contents = (
        <People initial={this.state.initial}
          searchText={this.state.searchText} onSearch={this._onSearchText}
          people={this.state.people} onSelect={this._onSelectPerson} />
      );
    }
    return (
      <App centered={false}>
        {contents}
      </App>
    );
  }

});

module.exports = PeopleFinder;