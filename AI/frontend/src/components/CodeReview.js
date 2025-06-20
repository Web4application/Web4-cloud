import React, { useState } from 'react';
import axios from 'axios';

const CodeReview = () => {
  const [code, setCode] = useState('');
  const [review, setReview] = useState('');

  const handleSubmit = async () => {
    try {
      const response = await axios.post('/generate_react', {
        data: code,
      });
      setReview(response.data.generated_code);
    } catch (error) {
      console.error('Error generating code review:', error);
    }
  };

  return (
    <div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here"
      />
      <button onClick={handleSubmit}>Generate Review</button>
      <pre>{review}</pre>
    </div>
  );
};

export default CodeReview;
