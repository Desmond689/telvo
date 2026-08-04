import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:telvo/config/app_config.dart';
import 'package:telvo/utils/error_messages.dart';
import 'package:telvo/utils/helpers.dart';

/// Uses Cloudinary for all image uploads. Firebase Storage is intentionally not
/// used for profile, job, or chat media uploads.
class StorageService {
  Future<String> _uploadToCloudinary({
    required String folder,
    required String fileName,
    required File file,
  }) async {
    final cloudName = AppConfig.cloudinaryCloudName;
    final uploadPreset = AppConfig.cloudinaryUploadPreset;
    if (cloudName.isEmpty || uploadPreset.isEmpty) {
      throw Exception(
        'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in your environment.',
      );
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://api.cloudinary.com/v1_1/$cloudName/image/upload'),
    );
    request.fields['upload_preset'] = uploadPreset;
    request.fields['folder'] = folder;
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
        filename: fileName,
      ),
    );

    final response = await request.send();
    final body = await response.stream.bytesToString();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Cloudinary upload failed: $body');
    }

    final json = jsonDecode(body) as Map<String, dynamic>;
    final url = json['secure_url'] as String?;
    if (url == null || url.isEmpty) {
      throw Exception('Cloudinary returned no secure URL');
    }
    return url;
  }

  Future<String?> uploadFileDirect({
    required File file,
    required String folder,
    String? fileName,
  }) async {
    try {
      final hasInternet = await Helpers.checkInternetConnection();
      if (!hasInternet) {
        throw const SocketException('No internet connection');
      }
      return await _uploadToCloudinary(
        file: file,
        folder: folder,
        fileName: fileName ?? file.uri.pathSegments.last,
      );
    } catch (e) {
      throw Exception(getFriendlyErrorMessage(e));
    }
  }

  Future<String?> uploadProfilePhoto(String userId, XFile image) async {
    try {
      return await _uploadToCloudinary(
        file: File(image.path),
        folder: 'profile_photos',
        fileName: '$userId.jpg',
      );
    } catch (_) {
      return null;
    }
  }

  Future<String?> uploadJobPhoto(String jobId, XFile image, int index) async {
    try {
      return await _uploadToCloudinary(
        file: File(image.path),
        folder: 'job_photos/$jobId',
        fileName: '$index.jpg',
      );
    } catch (_) {
      return null;
    }
  }

  Future<List<String>> uploadJobPhotos(String jobId, List<XFile> images) async {
    final urls = <String>[];
    for (int i = 0; i < images.length; i++) {
      final url = await uploadJobPhoto(jobId, images[i], i);
      if (url != null) {
        urls.add(url);
      }
    }
    return urls;
  }

  Future<String?> uploadPortfolioPhoto(
    String userId,
    XFile image,
    int index,
  ) async {
    try {
      return await _uploadToCloudinary(
        file: File(image.path),
        folder: 'portfolio_photos/$userId',
        fileName: '$index.jpg',
      );
    } catch (_) {
      return null;
    }
  }

  Future<String?> uploadChatImage(String chatId, XFile image) async {
    try {
      final fileName =
          '${DateTime.now().millisecondsSinceEpoch}_${image.name.replaceAll(RegExp(r'[^a-zA-Z0-9.]'), '_')}';
      return await _uploadToCloudinary(
        file: File(image.path),
        folder: 'chat_images/$chatId',
        fileName: fileName,
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteFile(String pathToDelete) async {
    return;
  }

  Future<void> deleteUserFolder(String userId) async {
    return;
  }

  Future<String> getDownloadUrl(String pathToFile) async {
    return pathToFile;
  }
}