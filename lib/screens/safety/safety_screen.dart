import 'package:flutter/material.dart';
import 'package:telvo/config/routes.dart';

class SafetyScreen extends StatefulWidget {
  const SafetyScreen({super.key});

  @override
  State<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends State<SafetyScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Safety'),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.security, color: Color(0xFF00C853)),
              title: const Text('Emergency contacts'),
              subtitle:
                  const Text('Keep trusted contacts ready for emergencies.'),
              onTap: () =>
                  Navigator.pushNamed(context, AppRoutes.trustedContacts),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading:
                  const Icon(Icons.shield_outlined, color: Color(0xFF00C853)),
              title: const Text('Verification'),
              subtitle: const Text('Verify your identity and increase trust.'),
              onTap: () {
                Navigator.pushNamed(context, '/id-verification');
              },
            ),
          ),
        ],
      ),
    );
  }
}
