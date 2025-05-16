import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';

const StudentIdCard = ({ student }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const generateIdCard = async () => {
    try {
      setLoading(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Load card template images
      const cardFront = new Image();
      cardFront.src = '/assets/card-front.png';
      const cardBack = new Image();
      cardBack.src = '/assets/card-back.png';

      // Wait for images to load
      await Promise.all([
        new Promise(resolve => cardFront.onload = resolve),
        new Promise(resolve => cardBack.onload = resolve)
      ]);

      // Set canvas size
      canvas.width = cardFront.width;
      canvas.height = cardFront.height;

      // Draw front card
      ctx.drawImage(cardFront, 0, 0);

      // Draw student image if exists
      if (student.profilePicture) {
        const userImage = new Image();
        userImage.src = student.profilePicture;
        await new Promise(resolve => userImage.onload = resolve);
        
        // Draw circular image
        ctx.save();
        ctx.beginPath();
        ctx.arc(120, 120, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userImage, 70, 70, 100, 100);
        ctx.restore();
      }

      // Add student details
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(`Name: ${student.firstName} ${student.lastName}`, 20, 200);
      ctx.fillText(`Roll ID: ${student.rollId}`, 20, 220);
      ctx.fillText(`CNIC: ${student.cnic}`, 20, 240);
      ctx.fillText(`Course: ${student.course || 'N/A'}`, 20, 260);

      // Create PDF
      const pdf = new jsPDF('landscape');
      const cardImage = canvas.toDataURL('image/png');
      pdf.addImage(cardImage, 'PNG', 10, 10, 190, 120);
      pdf.addImage(cardBack.src, 'PNG', 210, 10, 190, 120);

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'id_card.pdf');
      formData.append('studentId', student._id);

      // Send PDF to backend for email
      await axios.post('/api/students/send-id-card', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      alert('ID card has been generated and sent to your email!');
    } catch (error) {
      console.error('Error generating ID card:', error);
      setLoading(false);
      alert('Error generating ID card. Please try again.');
    }
  };

  return (
    <div className="id-card-generator">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button 
        onClick={generateIdCard}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Generating...' : 'Generate ID Card'}
      </button>
    </div>
  );
};

export default StudentIdCard; 