import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { QrCode2, Security } from '@mui/icons-material';
import { api } from '../../services/api';

const steps = ['Generate QR Code', 'Scan with Authenticator', 'Verify Code'];

const TwoFactorSetup: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/users/2fa/generate');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setActiveStep(1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/users/2fa/verify', {
        token: verificationCode,
      });
      setSuccess(true);
      setActiveStep(2);
      if (onComplete) {
        setTimeout(() => onComplete(), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Enable Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add an extra layer of security to your account
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Two-factor authentication has been successfully enabled!
          </Alert>
        )}

        {/* Step Content */}
        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Generating QR code...
            </Typography>
          </Box>
        )}

        {activeStep === 1 && !success && (
          <Box>
            {/* QR Code Display */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {qrCode ? (
                <Box>
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    style={{ maxWidth: '250px', border: '2px solid #ccc', borderRadius: '8px' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Scan this QR code with your authenticator app
                  </Typography>
                </Box>
              ) : (
                <CircularProgress />
              )}
            </Box>

            {/* Manual Entry */}
            {secret && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Can't scan? Enter this code manually:
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  sx={{ wordBreak: 'break-all' }}
                >
                  {secret}
                </Typography>
              </Box>
            )}

            {/* Verification Code Input */}
            <Typography variant="body2" gutterBottom>
              Enter the 6-digit code from your authenticator app:
            </Typography>
            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              placeholder="000000"
              disabled={isLoading}
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '24px', letterSpacing: '8px' },
              }}
              sx={{ mb: 3 }}
            />

            {/* Verify Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerify}
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Verify and Enable'}
            </Button>

            {/* Instructions */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="caption" color="info.dark" display="block" gutterBottom>
                <strong>Recommended Authenticator Apps:</strong>
              </Typography>
              <Typography variant="caption" color="info.dark" display="block">
                • Google Authenticator
              </Typography>
              <Typography variant="caption" color="info.dark" display="block">
                • Microsoft Authenticator
              </Typography>
              <Typography variant="caption" color="info.dark" display="block">
                • Authy
              </Typography>
            </Box>
          </Box>
        )}

        {activeStep === 2 && success && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main" gutterBottom>
              ✓ Setup Complete!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your account is now protected with two-factor authentication.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TwoFactorSetup;
