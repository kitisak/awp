import './style.css'

import React, { Component } from 'react';

import PropTypes from 'prop-types';
import chatIcon from './images/chatHead.png';

export default function ChatButton({ children, ...props }) {
  return (
    <img className="chat-btn" src={chatIcon} onClick={() => onChatIconClick()}/>
  );
}