import 'package:flutter/material.dart';
import 'package:telvo/screens/ai/ai_assistant_screen.dart';
import 'package:telvo/screens/auth/choose_mode_screen.dart';
import 'package:telvo/screens/auth/forgot_password_screen.dart';
import 'package:telvo/screens/auth/login_screen.dart';
import 'package:telvo/screens/auth/profile_setup_screen.dart';
import 'package:telvo/screens/auth/signup_screen.dart';
import 'package:telvo/screens/business/business_account_screen.dart';
import 'package:telvo/screens/chat/chat_list_screen.dart';
import 'package:telvo/screens/chat/chat_screen.dart';
import 'package:telvo/screens/customer/home_screen.dart';
import 'package:telvo/screens/customer/job_post_screen.dart';
import 'package:telvo/screens/customer/job_tracking_screen.dart';
import 'package:telvo/screens/customer/payment_screen.dart';
import 'package:telvo/screens/customer/professional_profile_screen.dart';
import 'package:telvo/screens/customer/review_screen.dart';
import 'package:telvo/screens/customer/search_screen.dart';
import 'package:telvo/screens/emergency/emergency_screen.dart';
import 'package:telvo/screens/customer/favorites_screen.dart';
import 'package:telvo/screens/customer/history_screen.dart';
import 'package:telvo/screens/notifications/notifications_screen.dart';
import 'package:telvo/screens/professional/availability_screen.dart';
import 'package:telvo/screens/professional/dashboard_screen.dart';
import 'package:telvo/screens/professional/earnings_screen.dart';
import 'package:telvo/screens/professional/job_feed_screen.dart';
import 'package:telvo/screens/professional/professional_setup_screen.dart';
import 'package:telvo/screens/professional/reviews_screen.dart';
import 'package:telvo/screens/professional/job_history_screen.dart';
import 'package:telvo/screens/profile/profile_screen.dart';
import 'package:telvo/screens/safety/safety_screen.dart';
import 'package:telvo/screens/safety/id_verification_screen.dart';
import 'package:telvo/screens/settings/settings_screen.dart';
import 'package:telvo/screens/sos/sos_screen.dart';
import 'package:telvo/screens/splash_screen.dart';
import 'package:telvo/screens/welcome_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String welcome = '/welcome';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String profileSetup = '/profile-setup';
  static const String chooseMode = '/choose-mode';
  static const String professionalSetup = '/professional-setup';
  static const String home = '/home';
  static const String professionalDashboard = '/professional-dashboard';
  static const String search = '/search';
  static const String professionalProfile = '/professional-profile';
  static const String jobPost = '/job-post';
  static const String jobTracking = '/job-tracking';
  static const String payment = '/payment';
  static const String review = '/review';
  static const String chat = '/chat';
  static const String chatList = '/chat-list';
  static const String notifications = '/notifications';
  static const String settings = '/settings';
  static const String profile = '/profile';
  static const String favorites = '/favorites';
  static const String history = '/history';
  static const String safety = '/safety';
  static const String idVerification = '/id-verification';
  static const String sos = '/sos';
  static const String trustedContacts = '/trusted-contacts';
  static const String jobHistory = '/job-history';
  static const String business = '/business';
  static const String aiAssistant = '/ai-assistant';
  static const String emergency = '/emergency';
  static const String availability = '/availability';
  static const String earnings = '/earnings';
  static const String jobFeed = '/job-feed';
  static const String reviews = '/reviews';

  static Route<dynamic> generateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case welcome:
        return MaterialPageRoute(builder: (_) => const WelcomeScreen());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case signup:
        final userType = routeSettings.arguments as String?;
        return MaterialPageRoute(
          builder: (_) => const SignupScreen(),
          settings: RouteSettings(arguments: userType),
        );
      case forgotPassword:
        return MaterialPageRoute(builder: (_) => const ForgotPasswordScreen());
      case profileSetup:
        return MaterialPageRoute(builder: (_) => const ProfileSetupScreen());
      case chooseMode:
        return MaterialPageRoute(builder: (_) => const ChooseModeScreen());
      case professionalSetup:
        return MaterialPageRoute(
          builder: (_) => const ProfessionalSetupScreen(),
        );
      case home:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case professionalDashboard:
        return MaterialPageRoute(
          builder: (_) => const ProfessionalDashboardScreen(),
        );
      case search:
        return MaterialPageRoute(builder: (_) => const SearchScreen());
      case professionalProfile:
        return MaterialPageRoute(
          builder: (_) => const ProfessionalProfileScreen(),
        );
      case jobPost:
        return MaterialPageRoute(builder: (_) => const JobPostScreen());
      case jobTracking:
        return MaterialPageRoute(builder: (_) => const JobTrackingScreen());
      case payment:
        return MaterialPageRoute(builder: (_) => const PaymentScreen());
      case review:
        return MaterialPageRoute(builder: (_) => const ReviewScreen());
      case chat:
        return MaterialPageRoute(builder: (_) => const ChatScreen());
      case chatList:
        return MaterialPageRoute(builder: (_) => const ChatListScreen());
      case notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());
      case settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      case profile:
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      case favorites:
        return MaterialPageRoute(builder: (_) => const FavoritesScreen());
      case history:
        return MaterialPageRoute(builder: (_) => const HistoryScreen());
      case jobHistory:
        return MaterialPageRoute(builder: (_) => const JobHistoryScreen());
      case safety:
        return MaterialPageRoute(builder: (_) => const SafetyScreen());
      case sos:
        return MaterialPageRoute(builder: (_) => const SOSScreen());
      case business:
        return MaterialPageRoute(builder: (_) => const BusinessAccountScreen());
      case aiAssistant:
        return MaterialPageRoute(builder: (_) => const AIAssistantScreen());
      case emergency:
        return MaterialPageRoute(builder: (_) => const EmergencyScreen());
      case availability:
        return MaterialPageRoute(builder: (_) => const AvailabilityScreen());
      case earnings:
        return MaterialPageRoute(builder: (_) => const EarningsScreen());
      case jobFeed:
        return MaterialPageRoute(builder: (_) => const JobFeedScreen());
      case reviews:
        return MaterialPageRoute(builder: (_) => const ReviewsScreen());
      default:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
    }
  }
}
