import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: number;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      api.get(`/foods/${routeParams.id}`).then(response => {
        const { price, ...rest } = response.data;
        const selectedFood: Food = {
          ...rest,
          price,
          formattedPrice: formatValue(price),
        };
        const extrasArray: Extra[] = response.data.extras;
        const extrasWithQuantity = extrasArray.map(item => {
          const extraQuantity = item;
          extraQuantity.quantity = 0;
          return extraQuantity;
        });
        setFood(selectedFood);
        setExtras(extrasWithQuantity);
      });
    }
    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const extraIncremented = extras.map(item => {
      const newExtraQuantity = item;
      if (id === newExtraQuantity.id) {
        if (newExtraQuantity.quantity === 0) {
          newExtraQuantity.quantity = 1;
        } else {
          newExtraQuantity.quantity += 1;
        }
      }
      return newExtraQuantity;
    });
    setExtras(extraIncremented);
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const extraDecremented = extras.map(item => {
      const newExtraQuantity = item;
      if (id === newExtraQuantity.id) {
        if (newExtraQuantity.quantity === 1) {
          newExtraQuantity.quantity = 0;
        } else if (newExtraQuantity.quantity > 1) {
          newExtraQuantity.quantity -= 1;
        }
      }
      return newExtraQuantity;
    });
    setExtras(extraDecremented);
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    const incrementedFood = foodQuantity + 1;
    setFoodQuantity(incrementedFood);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity > 1) {
      const decrementedFood = foodQuantity - 1;
      setFoodQuantity(decrementedFood);
    }
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    setIsFavorite(!isFavorite);

    const {
      id,
      name,
      description,
      price,
      image_url,
      category,
      thumbnail_url,
    } = food;
    await api.post('favorites', {
      id,
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
    });
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const foodTotal = food.price * foodQuantity;
    const extrasTotalArray = extras.map(item => {
      return item.quantity * item.value;
    });
    const extrasTotal = extrasTotalArray.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );

    const total = foodTotal + extrasTotal;

    return formatValue(total);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const { id, name, description, price, category, thumbnail_url } = food;

    await api.post('orders', {
      id: null,
      product_id: id,
      name,
      description,
      price,
      category,
      thumbnail_url,
      extras,
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
