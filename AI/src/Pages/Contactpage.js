// src/pages/ContactPage.jsx

import React from 'react';

const ContactPage = () => {
  return (
    <div>
      <h2>Contact Us</h2>
      <p>If you have any questions, feel free to reach out!</p>
      <form>
        <label>Name:</label>
        <input type="text" placeholder="Your name" />
        <br />
        <label>Email:</label>
        <input type="email" placeholder="Your email" />
        <br />
        <label>Message:</label>
        <textarea placeholder="Your message"></textarea>
        <br />
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
};

export default ContactPage;
