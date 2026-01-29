import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, ChevronLeft, ChevronRight, MessageCircle, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ImageViewer({ 
  files, 
  initialIndex = 0, 
  onClose, 
  comments = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  visitorName,
  visitorEmail,
  readOnly = false
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [pins, setPins] = useState([]);
  const [activePin, setActivePin] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef(null);

  const currentFile = files[currentIndex];
  const isImage = currentFile.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  // Get comments for current file
  const fileComments = comments.filter(c => c.file_index === currentIndex);

  // Update pins when changing files or when comments change
  React.useEffect(() => {
    setPins([]);
    setActivePin(null);
    setCommentText('');
    setEditingComment(null);
  }, [currentIndex, comments]);

  const handleImageClick = (e) => {
    if (!isImage || activePin !== null || readOnly) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate percentage position for responsive display
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    const newPin = {
      id: Date.now().toString(),
      x,
      y,
      percentX,
      percentY,
      isNew: true,
    };

    setPins([...pins, newPin]);
    setActivePin(newPin.id);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    if (editingComment) {
      // Edit existing comment
      await onEditComment(editingComment.id, commentText);
      setEditingComment(null);
    } else {
      // Add new comment
      const pin = pins.find(p => p.id === activePin);
      
      await onAddComment({
        text: commentText,
        file_index: currentIndex,
        coordinates: pin ? {
          x: pin.x,
          y: pin.y,
          percentX: pin.percentX,
          percentY: pin.percentY,
        } : null,
      });
      setPins(pins.filter(p => p.id !== activePin));
    }

    setCommentText('');
    setActivePin(null);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
    setActivePin('editing');
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm('Delete this comment?')) {
      await onDeleteComment(commentId);
    }
  };

  const goToNext = () => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setPins([]);
      setActivePin(null);
      setZoom(1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setPins([]);
      setActivePin(null);
      setZoom(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-medium">{currentFile.filename}</h3>
          <span className="text-slate-400 text-sm">
            {currentIndex + 1} / {files.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isImage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="text-white hover:bg-white/10"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="text-white hover:bg-white/10"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="lg"
            onClick={goToPrevious}
            className="absolute left-4 z-10 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {currentIndex < files.length - 1 && (
          <Button
            variant="ghost"
            size="lg"
            onClick={goToNext}
            className="absolute right-4 z-10 text-white hover:bg-white/10"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}

        {/* Image Display */}
        {isImage ? (
          <div className="relative max-w-full max-h-full p-8">
            <img
              ref={imageRef}
              src={currentFile.url}
              alt={currentFile.filename}
              onClick={readOnly ? undefined : handleImageClick}
              style={{ transform: `scale(${zoom})`, cursor: readOnly ? 'default' : (activePin ? 'default' : 'crosshair') }}
              className="max-w-full max-h-[80vh] object-contain transition-transform"
            />

            {/* Existing Comment Pins */}
            {fileComments.map((comment) => (
              comment.coordinates && (
                <div
                  key={comment.id}
                  className="absolute w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `${comment.coordinates.percentX}%`,
                    top: `${comment.coordinates.percentY}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditComment(comment);
                  }}
                  title={comment.text}
                >
                  <MessageCircle className="w-4 h-4" />
                </div>
              )
            ))}

            {/* New Pin Being Placed */}
            {pins.map((pin) => (
              <div
                key={pin.id}
                className="absolute w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse"
                style={{
                  left: pin.x,
                  top: pin.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                +
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white text-center p-8">
            <p className="mb-4">Preview not available for this file type</p>
            <a
              href={currentFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Download to view
            </a>
          </div>
        )}
      </div>

      {/* Comment Input (shown when pin is active or editing) */}
      {activePin && !readOnly && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <h4 className="font-medium text-slate-900 mb-3">
              {editingComment ? 'Edit comment' : 'Add your comment'}
            </h4>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="What would you like to change?"
              rows={3}
              className="mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingComment ? 'Save' : 'Add Comment'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setActivePin(null);
                  setEditingComment(null);
                  setPins(pins.filter(p => p.id !== activePin));
                  setCommentText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Sidebar */}
      {fileComments.length > 0 && !activePin && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 overflow-y-auto">
          <div className="p-4">
            <h4 className="font-semibold text-slate-900 mb-4">
              Comments ({fileComments.length})
            </h4>
            <div className="space-y-3">
              {fileComments.map((comment) => (
                <div key={comment.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200 group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{comment.author}</p>
                      <p className="text-xs text-slate-500">{comment.author_email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-slate-500">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </p>
                      {!readOnly && visitorEmail === comment.author_email && onEditComment && onDeleteComment && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditComment(comment)}
                            className="h-6 w-6 p-0"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            🗑️
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}