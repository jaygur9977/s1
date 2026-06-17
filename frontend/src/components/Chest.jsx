import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Chest.css';
import config from '../config';

const Chest = ({ uniqueKey }) => {
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [decompressedData, setDecompressedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [addMode, setAddMode] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', type: 'text', data: '', mimeType: 'text/plain' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Drag & Drop states
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [isDragOverDropZone, setIsDragOverDropZone] = useState(false);
    
    // File upload states
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFiles, setUploadingFiles] = useState([]);
    
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);
    const dragCounter = useRef(0);

    useEffect(() => {
        if (uniqueKey) fetchItems();
    }, [uniqueKey]);

    const fetchItems = async () => {
        try {
            const res = await fetch(`http://172.29.76.166:5000/api/chest/list/${uniqueKey}`);
            const data = await res.json();
            if (data.success) setItems(data.items);
        } catch (e) { console.error(e); }
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.data) return setError('Name and data required');
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${config.API_URL}/api/chest/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniqueKey, ...newItem })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('Item saved securely! 🔒');
                setAddMode(false);
                setNewItem({ name: '', type: 'text', data: '', mimeType: 'text/plain' });
                fetchItems();
                setTimeout(() => setSuccess(''), 3000);
            } else setError(data.message);
        } catch { setError('Failed to save'); }
        setLoading(false);
    };

    const handleDecompress = async (itemId) => {
        if (selectedItem === itemId && decompressedData) {
            // If already decompressed, close it
            setDecompressedData(null);
            setSelectedItem(null);
            return;
        }
        
        setLoading(true);
        setDecompressedData(null);
        try {
            const res = await fetch(`http://172.29.76.166:5000/api/chest/item/${itemId}`);
            const data = await res.json();
            if (data.success) {
                setDecompressedData(data.item);
                setSelectedItem(itemId);
            }
        } catch { setError('Failed to decompress'); }
        setLoading(false);
    };

    const handleDeleteItem = async (itemId, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this item permanently?')) return;
        
        try {
            await fetch(`http://172.29.76.166:5000/api/chest/item/${itemId}`, { method: 'DELETE' });
            if (selectedItem === itemId) {
                setSelectedItem(null);
                setDecompressedData(null);
            }
            fetchItems();
            setSuccess('Item deleted');
            setTimeout(() => setSuccess(''), 3000);
        } catch { setError('Failed to delete'); }
    };

    // ============================================================
    // FILE HANDLING FUNCTIONS
    // ============================================================

    const processFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const fileData = {
                    name: file.name,
                    type: file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('video/') ? 'file' :
                          file.type.startsWith('audio/') ? 'file' : 'document',
                    data: event.target.result,
                    mimeType: file.type,
                    size: file.size
                };
                resolve(fileData);
            };
            
            reader.onerror = reject;
            
            // For images and text files, read as data URL
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('text/') || file.type === 'application/json') {
                reader.readAsText(file);
            } else {
                // For other files, read as base64
                reader.readAsDataURL(file);
            }
        });
    };

    const uploadFilesToChest = async (files) => {
        const fileArray = Array.from(files);
        setUploadingFiles(fileArray.map(f => f.name));
        setUploadProgress(0);
        
        let successCount = 0;
        
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            
            try {
                const fileData = await processFile(file);
                
                const res = await fetch(`${config.API_URL}/api/chest/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uniqueKey,
                        name: fileData.name,
                        type: fileData.type,
                        data: fileData.data,
                        mimeType: fileData.mimeType
                    })
                });
                
                const data = await res.json();
                if (data.success) successCount++;
                
                setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
            }
        }
        
        setUploadingFiles([]);
        setUploadProgress(0);
        
        if (successCount > 0) {
            setSuccess(`${successCount} file(s) uploaded successfully! 🎉`);
            fetchItems();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError('Failed to upload files');
        }
    };

    // ============================================================
    // DRAG & DROP HANDLERS
    // ============================================================

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
            setIsDragOverDropZone(true);
        }
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        
        if (dragCounter.current === 0) {
            setIsDragging(false);
            setIsDragOverDropZone(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setIsDragOverDropZone(false);
        dragCounter.current = 0;
        
        const files = e.dataTransfer.files;
        
        if (files && files.length > 0) {
            // Validate file sizes (max 10MB each)
            const maxSize = 10 * 1024 * 1024;
            const invalidFiles = Array.from(files).filter(f => f.size > maxSize);
            
            if (invalidFiles.length > 0) {
                setError(`Files larger than 10MB not allowed: ${invalidFiles.map(f => f.name).join(', ')}`);
                return;
            }
            
            uploadFilesToChest(files);
        } else {
            // Handle dropped text/URL
            const text = e.dataTransfer.getData('text/plain');
            if (text) {
                setNewItem({
                    name: `Note - ${new Date().toLocaleString()}`,
                    type: 'text',
                    data: text,
                    mimeType: 'text/plain'
                });
                setAddMode(true);
            }
        }
    }, [uniqueKey]);

    const handleItemDragStart = (e, item) => {
        e.dataTransfer.setData('text/plain', item._id);
        setDragOverItem(item._id);
    };

    const handleItemDragEnd = () => {
        setDragOverItem(null);
    };

    // ============================================================
    // FILE EXPLORER HANDLERS
    // ============================================================

    const handleFileInputClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFilesToChest(files);
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownloadItem = (item) => {
        if (!decompressedData) return;
        
        let blob;
        if (decompressedData.type === 'image' || decompressedData.mimeType?.startsWith('image/')) {
            // Convert base64 to blob
            const byteString = atob(decompressedData.data.split(',')[1]);
            const mimeType = decompressedData.mimeType || 'image/png';
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            blob = new Blob([ab], { type: mimeType });
        } else {
            blob = new Blob([decompressedData.data], { type: decompressedData.mimeType || 'text/plain' });
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = decompressedData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ============================================================
    // KEYBOARD SHORTCUTS
    // ============================================================

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+N to add new item
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                setAddMode(true);
            }
            // Escape to close panels
            if (e.key === 'Escape') {
                setAddMode(false);
                setDecompressedData(null);
                setSelectedItem(null);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div 
            className="chest-container"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            ref={dropZoneRef}
        >
            {/* Global Drag Overlay */}
            {isDragging && (
                <div className="chest-drag-overlay">
                    <div className="drag-overlay-content">
                        <span className="drag-icon">📁</span>
                        <h3>Drop files here</h3>
                        <p>Files will be encrypted & compressed</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="chest-header">
                <div className="chest-title-section">
                    <span className="chest-icon">📦</span>
                    <div>
                        <h2>Secure Chest</h2>
                        <span className="chest-item-count">{items.length} items</span>
                    </div>
                </div>
                <div className="chest-header-actions">
                    <button 
                        className="chest-upload-btn"
                        onClick={handleFileInputClick}
                        title="Upload files"
                    >
                        <span>📤</span> Upload
                    </button>
                    <button 
                        className="chest-add-btn" 
                        onClick={() => setAddMode(!addMode)}
                        title={addMode ? 'Close' : 'Add text note'}
                    >
                        <span>{addMode ? '✕' : '✏️'}</span>
                        {addMode ? 'Close' : 'Note'}
                    </button>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                accept="*/*"
            />

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
                <div className="chest-upload-progress">
                    <div className="progress-header">
                        <span className="spinner"></span>
                        <span>Uploading {uploadingFiles.length} file(s)...</span>
                    </div>
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                </div>
            )}

            {/* Alerts */}
            {error && (
                <div className="chest-alert chest-alert-error">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}
            {success && (
                <div className="chest-alert chest-alert-success">
                    <span>✅</span> {success}
                    <button onClick={() => setSuccess('')}>✕</button>
                </div>
            )}

            {/* Add Panel */}
            {addMode && (
                <div className="chest-add-panel">
                    <h3>Add New Item</h3>
                    
                    <div className="add-panel-tabs">
                        <button 
                            className={`tab-btn ${newItem.type === 'text' ? 'active' : ''}`}
                            onClick={() => setNewItem(p => ({ ...p, type: 'text' }))}
                        >
                            📝 Text
                        </button>
                        <button 
                            className={`tab-btn ${newItem.type === 'file' ? 'active' : ''}`}
                            onClick={handleFileInputClick}
                        >
                            📁 File
                        </button>
                    </div>

                    <input
                        className="chest-input"
                        placeholder="Item name..."
                        value={newItem.name}
                        onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                    />
                    
                    {newItem.type === 'text' && (
                        <textarea
                            className="chest-textarea"
                            placeholder="Enter your secret data here...&#10;This will be encrypted and compressed."
                            value={newItem.data}
                            onChange={e => setNewItem(p => ({ ...p, data: e.target.value }))}
                            rows={6}
                        />
                    )}

                    {newItem.data && newItem.type === 'file' && (
                        <div className="file-preview">
                            <span>📄</span>
                            <span className="file-name">{newItem.name}</span>
                            <span className="file-size">
                                {(newItem.data.length / 1024).toFixed(1)} KB
                            </span>
                        </div>
                    )}

                    <div className="add-panel-actions">
                        <button 
                            className="chest-save-btn" 
                            onClick={handleAddItem} 
                            disabled={loading || !newItem.name || !newItem.data}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Encrypting...
                                </>
                            ) : (
                                <>
                                    <span>🔒</span> Save to Chest
                                </>
                            )}
                        </button>
                        <button 
                            className="chest-cancel-btn" 
                            onClick={() => {
                                setAddMode(false);
                                setNewItem({ name: '', type: 'text', data: '', mimeType: 'text/plain' });
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Drop Zone Hint */}
            {items.length === 0 && !addMode && (
                <div 
                    className={`chest-dropzone ${isDragOverDropZone ? 'active' : ''}`}
                    onClick={handleFileInputClick}
                >
                    <div className="dropzone-content">
                        <span className="dropzone-icon">📂</span>
                        <h3>Drag & Drop Files Here</h3>
                        <p>or click to browse files</p>
                        <span className="dropzone-hint">
                            Files are encrypted & compressed automatically
                        </span>
                    </div>
                </div>
            )}

            {/* Items Grid */}
            {items.length > 0 && (
                <div className="chest-items-grid">
                    {items.map(item => (
                        <div
                            key={item._id}
                            className={`chest-item-card ${selectedItem === item._id ? 'selected' : ''} ${dragOverItem === item._id ? 'drag-over' : ''}`}
                            onClick={() => handleDecompress(item._id)}
                            draggable
                            onDragStart={(e) => handleItemDragStart(e, item)}
                            onDragEnd={handleItemDragEnd}
                        >
                            <div className="chest-item-icon">
                                {item.type === 'image' ? '🖼️' : 
                                 item.type === 'file' ? '📄' : 
                                 item.type === 'document' ? '📑' : '📝'}
                            </div>
                            
                            <div className="chest-item-info">
                                <h4>{item.name}</h4>
                                <div className="chest-item-meta-row">
                                    <span className="chest-item-type">{item.type}</span>
                                    <span className="chest-item-dot">•</span>
                                    <span className="chest-item-size">
                                        {item.size ? (item.size / 1024).toFixed(1) + ' KB' : 'N/A'}
                                    </span>
                                </div>
                                <span className="chest-item-date">
                                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            
                            <div className="chest-item-status">
                                {selectedItem === item._id && decompressedData ? (
                                    <span className="status-unlocked" title="Decompressed">🔓</span>
                                ) : loading && selectedItem === item._id ? (
                                    <span className="spinner-small"></span>
                                ) : (
                                    <span className="status-locked" title="Click to decompress">🔒</span>
                                )}
                            </div>

                            <button 
                                className="chest-item-delete"
                                onClick={(e) => handleDeleteItem(item._id, e)}
                                title="Delete item"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Decompressed Data Panel */}
            {decompressedData && (
                <div className="chest-decompressed-panel">
                    <div className="decompressed-header">
                        <div className="decompressed-title">
                            <span>
                                {decompressedData.type === 'image' ? '🖼️' : 
                                 decompressedData.type === 'file' ? '📄' : '📝'}
                            </span>
                            <h3>{decompressedData.name}</h3>
                        </div>
                        <div className="decompressed-actions">
                            <button 
                                className="decompressed-action-btn"
                                onClick={() => handleDownloadItem(decompressedData)}
                                title="Download"
                            >
                                💾 Save
                            </button>
                            <button 
                                className="decompressed-action-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(decompressedData.data);
                                    setSuccess('Copied to clipboard!');
                                    setTimeout(() => setSuccess(''), 2000);
                                }}
                                title="Copy to clipboard"
                            >
                                📋 Copy
                            </button>
                            <button 
                                className="decompressed-close-btn"
                                onClick={() => {
                                    setDecompressedData(null);
                                    setSelectedItem(null);
                                }}
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    
                    <div className="chest-decompressed-content">
                        {decompressedData.type === 'image' || decompressedData.mimeType?.startsWith('image/') ? (
                            <img 
                                src={decompressedData.data} 
                                alt={decompressedData.name}
                                className="decompressed-image"
                            />
                        ) : (
                            <pre className="decompressed-text">{decompressedData.data}</pre>
                        )}
                    </div>

                    <div className="decompressed-meta">
                        <span>Type: {decompressedData.mimeType}</span>
                        <span>Size: {decompressedData.size ? (decompressedData.size / 1024).toFixed(1) + ' KB' : 'N/A'}</span>
                        <span>Created: {new Date(decompressedData.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="chest-shortcuts">
                <span>💡 Tips: Drag & drop files • Ctrl+N for new note • Esc to close</span>
            </div>
        </div>
    );
};

export default Chest;