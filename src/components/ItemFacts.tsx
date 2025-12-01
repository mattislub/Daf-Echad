import { useState, type ReactNode } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Book } from '../types/catalog';
import { Package, User, Building2, Ruler, Palette, BookOpen, Languages, FileText, Hash, Tags, ChevronDown } from 'lucide-react';

interface ItemFactsProps {
  book: Book;
}

interface FactItem {
  icon: ReactNode;
  label: string;
  value: string;
}

export default function ItemFacts({ book }: ItemFactsProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {language === 'he' ? 'פרטי המוצר' : 'Product Details'}
            </p>
            <p className="text-base font-semibold text-gray-900">
              {language === 'he' ? 'הרחב לפרטים נוספים' : 'Expand for more details'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {facts.map((fact, index) => (
              <div
                key={index}
                className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0"
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
      )}
    </div>
  );
}
