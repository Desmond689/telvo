import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:telvo/services/storage_service.dart';
import 'package:telvo/utils/error_messages.dart';

class ProfilePhotoPicker extends StatefulWidget {
  final Future<String?> Function(String filePath)? onPhotoSelected;
  final String? initialPhoto;
  final String? userId;

  const ProfilePhotoPicker({
    super.key,
    this.onPhotoSelected,
    this.initialPhoto,
    this.userId,
  });

  @override
  State<ProfilePhotoPicker> createState() => _ProfilePhotoPickerState();
}

class _ProfilePhotoPickerState extends State<ProfilePhotoPicker> {
  String? _photoUrl;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _photoUrl = widget.initialPhoto;
  }

  @override
  void didUpdateWidget(ProfilePhotoPicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialPhoto != widget.initialPhoto) {
      setState(() {
        _photoUrl = widget.initialPhoto;
      });
    }
  }

  Future<void> _pickImage() async {
    await _selectAndUpload(ImageSource.gallery);
  }

  Future<void> _takePhoto() async {
    await _selectAndUpload(ImageSource.camera);
  }

  Future<void> _selectAndUpload(ImageSource source) async {
    final picker = ImagePicker();
    try {
      final image = await picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (image == null || !mounted) return;

      setState(() {
        _photoUrl = image.path;
        _isLoading = true;
      });

      String? uploadedUrl;
      try {
        if (widget.onPhotoSelected != null) {
          // Let the parent handle uploading (recommended). Parent should return the uploaded URL.
          uploadedUrl = await widget.onPhotoSelected!(image.path);
        } else {
          // Fallback: upload directly using StorageService for backward compatibility.
          uploadedUrl = await StorageService().uploadFileDirect(
            file: File(image.path),
            folder: 'profile_photos',
            fileName:
                '${widget.userId ?? 'user'}_${DateTime.now().millisecondsSinceEpoch}.jpg',
          );
        }
      } catch (e) {
        uploadedUrl = null;
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Photo upload failed: ${getFriendlyErrorMessage(e)}')),
        );
      }

      if (!mounted) return;

      if (uploadedUrl != null && uploadedUrl.isNotEmpty) {
        setState(() {
          _photoUrl = uploadedUrl;
          _isLoading = false;
        });
      } else {
        // Keep the local preview but stop loading so user can retry
        setState(() => _isLoading = false);
        if (widget.onPhotoSelected == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not upload photo. Please try again.'),
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Photo upload failed: $e')),
      );
    }
  }

  void _showPickerOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
            ListTile(
              leading: const Icon(Icons.close),
              title: const Text('Cancel'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _showPickerOptions,
      child: Stack(
        children: [
          CircleAvatar(
            radius: 48,
            backgroundColor: Colors.grey.shade200,
            backgroundImage: _photoUrl != null
                ? (_photoUrl!.startsWith('http')
                    ? NetworkImage(_photoUrl!)
                    : FileImage(File(_photoUrl!)) as ImageProvider)
                : null,
            onBackgroundImageError: (_, __) {
              // Fall back to the default icon if the image fails to load.
              setState(() {
                _photoUrl = null;
              });
            },
            child: _photoUrl == null
                ? const Icon(Icons.person, size: 48, color: Colors.grey)
                : null,
          ),
          if (_isLoading)
            Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black26,
              ),
              child: const Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
              ),
            ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Color(0xFF00C853),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.camera_alt,
                color: Colors.white,
                size: 18,
              ),
            ),
          ),
        ],
      ),
    );
  }
}