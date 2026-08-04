import 'package:flutter/material.dart';
import 'package:telvo/utils/app_colors.dart';

class LookupData {
  LookupData._();

  static const List<String> jobCategories = [
    'Plumber (Domestic)',
    'Plumber (Emergency Repair)',
    'Borehole Technician',
    'Water Tank Cleaner',
    'Pump Installer',
    'Drain Cleaner',
    'Water Heater Technician',
    'Septic Tank Emptier',
    'Water Meter Installer',
    'Tap & Fixture Installer',
    'Leak Detection Specialist',
    'Water Filter Installer',
    'Electrician (Domestic)',
    'Generator Technician',
    'Solar Panel Installer',
    'Inverter Installer',
    'Air Conditioner Installer',
    'Air Conditioner Repairer',
    'Rewiring Electrician',
    'Prepaid Meter Installer',
    'Ceiling Fan Installer',
    'CCTV Camera Installer',
    'Satellite Dish / Canal+ Installer',
    'Mason (Bricklayer)',
    'Tiler (Floor & Wall)',
    'Painter (Wall & Building)',
    'POP Ceiling Designer',
    'Concrete Worker',
    'Foundation Builder',
    'Demolition Worker',
    'Waterproofing Specialist',
    'Roofer (Roof Repair)',
    'Scaffolder',
    'Paving Stone Layer',
    'Glazier (Window Glass)',
    'Welder (Gate Fabricator)',
    'Carpenter (Furniture)',
    'Carpenter (Roofing)',
    'Door Frame Installer',
    'Upholsterer (Sofa Repair)',
    'Locksmith (Key Specialist)',
    'Aluminum Fitter',
    'Cabinet Maker',
    'Wood Polisher',
    'Metal Gate Repairer',
    'Burglar Proof Installer',
    'Curtain Rail Installer',
    'Cleaner (Deep House)',
    'Cleaner (Post-Construction)',
    'Cleaner (Sofa & Carpet)',
    'Window Cleaner',
    'Laundry & Ironing Worker',
    'Office Cleaner',
    'Pest Control Specialist (Fumigation)',
    'Garbage Collector',
    'Compound Sweeper',
    'Tank Disinfector',
    'Septic Treatment Worker',
    'Gutter Cleaner',
    'Floor Polisher',
    'Grass Cutter (Lawn Mower)',
    'Tree Trimmer',
    'Landscape Gardener',
    'Flower Gardener',
    'Backyard Farm Installer',
    'Poultry Pen Builder',
    'Fish Pond Cleaner',
    'Soil Treater',
    'Weed Control Worker',
    'Stump Remover',
    'Yard Beautifier',
    'Fridge & Freezer Repairer',
    'Washing Machine Repairer',
    'Microwave & Oven Repairer',
    'Gas Cooker Repairer',
    'TV Repairer',
    'Sound System Installer',
    'Wi-Fi Router Technician',
    'Smart TV Installer',
    'Computer Repairer',
    'Battery Tester',
    'Intercom Installer',
    'Electric Fence Installer',
    'Automatic Gate Repairer',
    'Chef / Home Cook',
    'Event Decorator',
    'Tent / Canopy Rigger',
    'DJ / Sound Operator',
    'Event Usher',
    'Baker (Cakes & Snacks)',
    'Nanny / Babysitter',
    'Elderly Caregiver',
    'Tutor (Primary School)',
    'Tutor (Secondary School)',
    'Music Teacher',
    'Gym / Personal Trainer',
    'Hairbraider / Hairstylist',
    'Barber (Home Service)',
    'Makeup Artist',
    'Manicurist / Pedicurist',
  ];

  static const List<String> supportedCities = [
    'Centre - Yaoundé',
    'Centre - Mbalmayo',
    'Centre - Obala',
    'Centre - Bafia',
    'Centre - Eseka',
    'Centre - Akonolinga',
    'Littoral - Douala',
    'Littoral - Nkongsamba',
    'Littoral - Edéa',
    'Littoral - Mbanga',
    'Littoral - Yabassi',
    'Littoral - Loum',
    'South West - Buea',
    'South West - Limbe',
    'South West - Kumba',
    'South West - Tiko',
    'South West - Mamfe',
    'South West - Muyuka',
    'South West - Mundemba',
    'North West - Bamenda',
    'North West - Kumbo',
    'North West - Mbengwi',
    'North West - Wum',
    'North West - Ndop',
    'North West - Nkambe',
    'West - Bafoussam',
    'West - Dschang',
    'West - Foumban',
    'West - Mbouda',
    'West - Bangangté',
    'West - Bafang',
    'West - Baham',
    'South - Kribi',
    'South - Ebolowa',
    'South - Sangmélima',
    'South - Ambam',
    'South - Campo',
    'East - Bertoua',
    'East - Batouri',
    'East - Abong-Mbang',
    'East - Yokadouma',
    'East - Bélabo',
    'Adamaoua - Ngaoundéré',
    'Adamaoua - Meiganga',
    'Adamaoua - Tibati',
    'Adamaoua - Banyo',
    'North - Garoua',
    'North - Guider',
    'North - Figuil',
    'North - Lagdo',
    'Far North - Maroua',
    'Far North - Kousséri',
    'Far North - Mokolo',
    'Far North - Yagoua',
    'Far North - Mora',
  ];

  static IconData iconForCategory(String category) {
    final name = category.toLowerCase();
    if (name.contains('plumb')) return Icons.plumbing_rounded;
    if (name.contains('electri') || name.contains('generator')) return Icons.electrical_services_rounded;
    if (name.contains('clean') || name.contains('laundry') || name.contains('sweeper') || name.contains('disinfector')) return Icons.cleaning_services_rounded;
    if (name.contains('paint') || name.contains('decor') || name.contains('designer')) return Icons.format_paint_rounded;
    if (name.contains('carpenter') || name.contains('mason') || name.contains('wood') || name.contains('gate')) return Icons.handyman_rounded;
    if (name.contains('mechanic') || name.contains('motor') || name.contains('repair') || name.contains('fridge') || name.contains('washing') || name.contains('microwave') || name.contains('tv')) return Icons.build_rounded;
    if (name.contains('garden') || name.contains('lawn') || name.contains('tree') || name.contains('landscape') || name.contains('flower') || name.contains('weed')) return Icons.grass_rounded;
    if (name.contains('tutor') || name.contains('teacher') || name.contains('music')) return Icons.school_rounded;
    if (name.contains('photo') || name.contains('camera') || name.contains('dj') || name.contains('event') || name.contains('sound')) return Icons.camera_alt_rounded;
    if (name.contains('chef') || name.contains('cook') || name.contains('baker')) return Icons.restaurant_rounded;
    if (name.contains('babysitter') || name.contains('nanny') || name.contains('caregiver') || name.contains('elderly')) return Icons.child_care_rounded;
    if (name.contains('driver') || name.contains('taxi') || name.contains('car')) return Icons.local_taxi_rounded;
    if (name.contains('security') || name.contains('guard') || name.contains('cctv') || name.contains('locksmith')) return Icons.security_rounded;
    if (name.contains('air conditioner') || name.contains('solar') || name.contains('battery') || name.contains('wifi')) return Icons.electrical_services_rounded;
    return Icons.work_outline_rounded;
  }

  static Color colorForCategory(String category) {
    final name = category.toLowerCase();
    if (name.contains('plumb')) return AppColors.plumbing;
    if (name.contains('electri') || name.contains('generator')) return AppColors.electrical;
    if (name.contains('clean') || name.contains('laundry') || name.contains('sweeper') || name.contains('disinfector')) return AppColors.cleaning;
    if (name.contains('paint') || name.contains('decor') || name.contains('designer')) return AppColors.painting;
    if (name.contains('carpenter') || name.contains('mason') || name.contains('wood') || name.contains('gate')) return AppColors.carpentry;
    if (name.contains('garden') || name.contains('lawn') || name.contains('tree') || name.contains('landscape') || name.contains('flower') || name.contains('weed')) return AppColors.gardening;
    if (name.contains('tutor') || name.contains('teacher') || name.contains('music')) return AppColors.tutoring;
    if (name.contains('photo') || name.contains('camera') || name.contains('dj') || name.contains('event') || name.contains('sound')) return AppColors.photography;
    if (name.contains('chef') || name.contains('cook') || name.contains('baker')) return AppColors.chef;
    if (name.contains('babysitter') || name.contains('nanny') || name.contains('caregiver') || name.contains('elderly')) return AppColors.babysitter;
    if (name.contains('security') || name.contains('guard') || name.contains('cctv') || name.contains('locksmith')) return AppColors.secondary;
    return AppColors.primary;
  }
}
