var React = require('react');
var ReactAddons = require('react-addons');
var cx = ReactAddons.classSet;
var _s = require('underscore.string');
var domUtils = require('../../../common/dom-utils');
var moment = require('moment');
var $ = require('jquery');
var updateNoteAction = require('../../../actions/updateNote');
var updateUserNotesAction = require('../../../actions/updateUserNotes');
var selectedNoteStore = require('../../../stores/selectedNoteStore');
var bookShelfStore = require('../../../stores/bookshelfStore');
var modalStore = require('../../../stores/modalStore');
var ModalForm = require('../modal-form/modalForm');

var cursor = null;

var moveCursor = function (domNode) {

	var currentPosition = domUtils.getCaret(domNode);
	var text = _s.insert(domNode.value, currentPosition, 'D258DC19ED0D4065AAB60FEAAC8029A6');

	return text;
};

var replaceCursor = function (text) {

	return text.replace(/D258DC19ED0D4065AAB60FEAAC8029A6/, domUtils.iOS ? '' : '<span id="spanCaret" style="display: inline;" class="caret blink-me">|</span>');
};

var showCaret = function () {

	var caret = document.getElementById('spanCaret');

	if (caret) {
		
		caret.style.display = 'inline';
	}
};

var hideCaret = function () {

	var caret = document.getElementById('spanCaret');

	if (caret) {

		caret.style.display = 'none';
	}
};

var sanitizeHTML = function (html) {

	var newHTML = html.replace('<span id="spanCaret" style="display: inline;" class="caret blink-me">|</span>', '');

	return newHTML.replace(/(<[^>]*>)/g, '').replace(/&nbsp;/g, ' ');
};

var notepadComponent = React.createClass({

	_selectedNote: function () {

		if (this.state.noteId !== selectedNoteStore.noteId) {
			$(this.refs.txtArea.getDOMNode()).val(sanitizeHTML(selectedNoteStore.noteText));
		}

		this.setState({
			noteId: selectedNoteStore.noteId,
			noteTitle: selectedNoteStore.noteTitle,
			noteText: selectedNoteStore.noteText
		});
	},

	_modalOpened: function () {

		this.forceUpdate();
	},

	getInitialState: function() {
    	return {
    		noteId: null,
    		noteTitle: '',
    		noteText: ''
    	};
	},

	componentDidMount: function () {

		selectedNoteStore.onChange(this._selectedNote);
		modalStore.onChange(this._modalOpened);
	},

	handleChange: function (event) {

		var text = moveCursor(event.target);
		var lines = text.split(/\r\n|\r|\n/g);
		var finalTextArray = [];
		var finalText = '';

		lines.map(function (line) {

			var words = line.split(' ');
			var styledText = [];
			var outputText = '';

			words.map(function (word) {

				if (_s.startsWith(word, '#') || _s.startsWith(word, 'D258DC19ED0D4065AAB60FEAAC8029A6#')) {

					word = '<span class="hashtag">' + word + '</span>';
				}

				styledText.push(word);
			});

			outputText = styledText.join('&nbsp;');

			outputText = replaceCursor(outputText);

			finalTextArray.push(outputText);
		});

		finalText = finalTextArray.join('\r\n');

		updateNoteAction({
			noteId: this.state.noteId,
			noteTitle: this.state.noteTitle,
			noteText: finalText
		});
		
		showCaret();
	},

	handleTitleChange: function (event) {

		var self = this;

		bookShelfStore.userNotes.map(function (userNoteItem) {

			if (userNoteItem.noteId === self.state.noteId) {

				userNoteItem.noteTitle = event.target.value;
			} 
		});

		updateUserNotesAction(bookShelfStore.userNotes);

		updateNoteAction({
			noteId: self.state.noteId,
			noteTitle: event.target.value,
			noteText: self.state.noteText
		});
	},

	handleBlur: function (event) {

		hideCaret();
	},

	handleSettingClick: function (event) {

		this.refs.settingsModal.open();
	},

	handleSettingsSaved: function (event) {


	},

	render: function () {

		var lineCount = Math.floor($('#txtHiddenTextArea').prop('scrollHeight') / 40) || this.state.noteText.split(/\r\n|\r|\n/g).length;

		var calculatedNotepadHeight = lineCount < 8 ? 360 : 360 + ((lineCount - 7) * 40);

		var value = this.state.noteText.replace(/(?:\r\n|\r|\n)/g, '<br />');

		var sanitizedText = sanitizeHTML(this.state.noteText);

		var txtAreaCSSClasses = cx({
			'ios': domUtils.iOS,
			'txt-area': true,
			'txt-area-hidden': true,
			'hide': this.props.isViewingBookshelf
		});

		var shouldBeDisabled = (modalStore.numberOfModalsOpened > 0) || (domUtils.isMobile && bookShelfStore.isViewingBookshelf);

		return 	<div className="notepad" style={{ height: calculatedNotepadHeight + 'px' }}>
					<div className="pink-divider"></div>
					<div className="notepad-header">
						<input className="notepad-title" type="text" maxLength="25" placeholder="Enter a title" onChange={this.handleTitleChange} 
						disabled={shouldBeDisabled} value={this.state.noteTitle} />
						<span className="generic-transition notepad-gear ion-gear-b" onClick={this.handleSettingClick}></span>
					</div>
					<div className="txt-area txt-area-div" dangerouslySetInnerHTML={{__html: value}}></div>
					<textarea id="txtArea" ref="txtArea" className={txtAreaCSSClasses} onBlur={this.handleBlur} onFocus={this.handleChange} onKeyDown={this.handleChange} 
					onKeyUp={this.handleChange} onClick={this.handleChange} onChange={this.handleChange} disabled={shouldBeDisabled} defaultValue={sanitizedText}></textarea>
					<textarea id="txtHiddenTextArea" style={{ display: 'none' }} defaultValue={sanitizedText} />
					<ModalForm ref="settingsModal" btnSubmitText="DELETE NOTE" modalTitle="SETTINGS" onSubmit={this.handleSettingsSaved}>
					</ModalForm>
				</div>;
	}

});

module.exports = notepadComponent;
