import { Box } from '@mui/material';
import './styles.css';

export const TextSkeletonLoader = () => {
  return (
    <Box sx={{ p: 1 }}>
      <div className="text-skeleton-line"></div>
      <div className="text-skeleton-line"></div>
      <div className="text-skeleton-line"></div>
    </Box>
  );
};