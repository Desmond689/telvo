import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:telvo/providers/auth_provider.dart';
import 'package:telvo/services/storage_service.dart';
import 'package:telvo/widgets/custom_button.dart';
import 'package:telvo/utils/error_messages.dart';

class IDVerificationScreen extends StatefulWidget {
  const IDVerificationScreen({super.key});

  @override
  State<IDVerificationScreen> createState() => _IDVerificationScreenState();
}

class _IDVerificationScreenState extends State<IDVerificationScreen> {
  XFile? _front;
  XFile? _back;
  bool _isSubmitting = false;

  Future<void> _pick(bool front) async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
      maxWidth: 1600,
    );
    if (picked == null || !mounted) return;
    setState(() {
      if (front) _front = picked; else _back = picked;
    });
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    final userId = auth.currentUser?.id;
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You must be signed in')));
      return;
    }
    if (_front == null && _back == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide at least one ID photo')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final storage = StorageService();
      final uploaded = <String>[];
      if (_front != null) {
        final url = await storage.uploadFileDirect(file: File(_front!.path), folder: 'verifications/$userId', fileName: 'front_${DateTime.now().millisecondsSinceEpoch}.jpg');
        if (url != null) uploaded.add(url);
      }
      if (_back != null) {
        final url = await storage.uploadFileDirect(file: File(_back!.path), folder: 'verifications/$userId', fileName: 'back_${DateTime.now().millisecondsSinceEpoch}.jpg');
        if (url != null) uploaded.add(url);
      }

      await FirebaseFirestore.instance.collection('verifications').add({
        'userId': userId,
        'photos': uploaded,
        'status': 'pending',
        'submittedAt': FieldValue.serverTimestamp(),
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Verification submitted — admin will review it shortly.')));
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      final msg = getFriendlyErrorMessage(e);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Verification failed: $msg')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ID Verification')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Upload your ID documents for verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Text('Provide a clear photo of the front and optionally the back of your ID (passport, national ID card).') ,
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => _pick(true),
                    child: Container(
                      height: 160,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Theme.of(context).colorScheme.outline),
                      ),
                      child: _front == null
                          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: const [Icon(Icons.camera_alt, size: 36), SizedBox(height: 8), Text('Upload front')]))
                          : Image.file(File(_front!.path), fit: BoxFit.cover),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _pick(false),
                    child: Container(
                      height: 160,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Theme.of(context).colorScheme.outline),
                      ),
                      child: _back == null
                          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: const [Icon(Icons.camera_alt_outlined, size: 36), SizedBox(height: 8), Text('Upload back')]))
                          : Image.file(File(_back!.path), fit: BoxFit.cover),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            CustomButton(
              text: _isSubmitting ? 'Submitting...' : 'Submit for verification',
              onPressed: _isSubmitting ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}
