import { useLanguage } from '../context/LanguageContext';
import { Book } from '../types/catalog';
import { Package, User, Building2, Ruler, Palette, BookOpen, Languages, FileText, Hash, Tags } from 'lucide-react';

interface ItemFactsProps {
  book: Book;
}

interface FactItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function ItemFacts({ book }: ItemFactsProps) {
  const { language } = useLanguage();

  const facts: FactItem[] = [
    {
      icon: <Hash className="w-5 h-5" />,
      label: language === 'he' ? 'מק"ט' : 'Item Number',
      value: book.item_number || '-',
    },
    {
      icon: <User className="w-5 h-5" />,
      label: language === 'he' ? 'מחבר' : 'Author',
      value: book.author?.name || '-',
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      label: language === 'he' ? 'הוצאה לאור' : 'Publisher',
      value: book.publisher?.name || '-',
    },
    {
      icon: <Ruler className="w-5 h-5" />,
      label: language === 'he' ? 'גודל' : 'Size',
      value: book.size || '-',
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: language === 'he' ? 'מידות' : 'Dimensions',
      value: book.dimensions || '-',
    },
    {
      icon: <Palette className="w-5 h-5" />,
      label: language === 'he' ? 'צבע' : 'Color',
      value: book.color || '-',
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: language === 'he' ? 'כריכה' : 'Binding',
      value: book.binding || '-',
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: language === 'he' ? 'כרכים' : 'Volumes',
      value: book.volumes.toString(),
    },
    {
      icon: <Languages className="w-5 h-5" />,
      label: language === 'he' ? 'שפה' : 'Language',
      value: book.language || '-',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: language === 'he' ? 'טקסט מקורי' : 'Original Text',
      value: book.original_text
        ? language === 'he'
          ? 'כן'
          : 'Yes'
        : language === 'he'
        ? 'לא'
        : 'No',
    },
    {
      icon: <Tags className="w-5 h-5" />,
      label: language === 'he' ? 'מילות מפתח' : 'Keywords',
      value: book.keywords && book.keywords.length > 0 ? book.keywords.join(', ') : '-',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="w-6 h-6 text-yellow-600" />
        {language === 'he' ? 'פרטי המוצר' : 'Product Details'}
      </h3>
      <div className="space-y-3">
        {facts.map((fact, index) => (
          <div
            key={index}
            className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
          >
            <div className="text-yellow-600 mt-0.5">{fact.icon}</div>
            <div className="flex-1">
              <dt className="text-sm font-medium text-gray-500">{fact.label}</dt>
              <dd className="text-base font-semibold text-gray-900 mt-0.5">{fact.value}</dd>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
