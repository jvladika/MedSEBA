import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    Typography, 
    Box,
    IconButton,
    Tooltip,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Snackbar
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface CitationDialogProps {
    open: boolean;
    onClose: () => void;
    citations: {
        bibtex: string;
        mla: string;
        apa: string;
    } | null;
}

export const CitationDialog: React.FC<CitationDialogProps> = ({ open, onClose, citations }) => {
    const theme = useTheme();
    const [openSnackbar, setOpenSnackbar] = React.useState(false);
    const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setOpenSnackbar(true);
        setTimeout(() => {
            setCopiedIndex(null);
            setOpenSnackbar(false);
        }, 2000);
    };

    const CitationAccordion = ({ title, citation, index }: { title: string; citation: string; index: number }) => (
        <Accordion 
            sx={{
                mb: 2,
                backgroundColor: 'white',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                '&:before': {
                    display: 'none',
                },
                '& .MuiAccordionSummary-root': {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: 'black' }} />}
                sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px 8px 0 0',
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    width: '100%',
                    pr: 2
                }}>
                    <Typography 
                        variant="subtitle1" 
                        sx={{ 
                            color: "#1976d2",
                            fontWeight: 600
                        }}
                    >
                        {title}
                    </Typography>
                    <Tooltip 
                        title="Copy to clipboard"
                        open={copiedIndex !== index ? undefined : false}
                    >
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(citation, index);
                            }}
                            sx={{
                                color: 'black',
                                animation: copiedIndex === index ? 'blink 0.5s' : 'none',
                                '@keyframes blink': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.3 },
                                    '100%': { opacity: 1 }
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                            size="small"
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: 'black',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        p: 1.5,
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                    }}
                >
                    {citation}
                </Typography>
            </AccordionDetails>
        </Accordion>
    );

    return (
        <>
            <Dialog 
                open={open} 
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#212121',
                        backgroundImage: 'none',
                        borderRadius: '12px',
                        boxShadow: theme.shadows[5]
                    }
                }}
            >
                <DialogTitle sx={{ px: 3, py: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: '#fff',
                                fontWeight: 600
                            }}
                        >
                            Citation Formats
                        </Typography>
                        <IconButton 
                            onClick={onClose} 
                            sx={{ 
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                            size="small"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 2 }}>
                    {citations && (
                        <>
                            <CitationAccordion title="BibTeX" citation={citations.bibtex} index={0} />
                            <CitationAccordion title="MLA" citation={citations.mla} index={1} />
                            <CitationAccordion title="APA" citation={citations.apa} index={2} />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                message="Citation copied to clipboard!"
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{
                    '& .MuiSnackbarContent-root': {
                        backgroundColor: '#1976d2',
                        color: 'white'
                    }
                }}
            />
        </>
    );
};
