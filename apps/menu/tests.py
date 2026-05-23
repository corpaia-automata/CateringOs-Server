from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.engine.models import EventIngredient
from apps.events.models import Event
from apps.master.models import Dish, DishRecipe, Ingredient

from .models import EventMenuItem


class EventMenuItemUpdateTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email='manager@example.com',
            password='password',
            first_name='Menu',
            last_name='Manager',
        )
        self.client.force_authenticate(self.user)

        self.event = Event.objects.create(
            customer_name='Menu Client',
            guest_count=100,
            service_type=Event.ServiceType.BUFFET,
        )
        self.rice = Ingredient.objects.create(
            name='Rice',
            category=Ingredient.Category.GROCERY,
            unit_of_measure=Ingredient.UOM.KG,
        )
        self.beans = Ingredient.objects.create(
            name='Beans',
            category=Ingredient.Category.GROCERY,
            unit_of_measure=Ingredient.UOM.KG,
        )
        self.biryani = Dish.objects.create(
            name='Biryani',
            category='Mains',
            unit_type=Dish.UnitType.PLATE,
        )
        self.curry = Dish.objects.create(
            name='Curry',
            category='Mains',
            unit_type=Dish.UnitType.PLATE,
        )
        DishRecipe.objects.create(
            dish=self.biryani,
            ingredient=self.rice,
            qty_per_unit=Decimal('100'),
            unit='g',
        )
        DishRecipe.objects.create(
            dish=self.curry,
            ingredient=self.beans,
            qty_per_unit=Decimal('50'),
            unit='g',
        )
        self.item = EventMenuItem.objects.create(
            event=self.event,
            dish=self.biryani,
            quantity=Decimal('10'),
        )

    def menu_item_url(self):
        return f'/api/events/{self.event.id}/menu-items/{self.item.id}/'

    def test_changing_dish_refreshes_snapshot_and_calculation(self):
        response = self.client.patch(
            self.menu_item_url(),
            {'dish': str(self.curry.id)},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.item.refresh_from_db()

        self.assertEqual(self.item.dish, self.curry)
        self.assertEqual(self.item.dish_name_snapshot, self.curry.name)
        self.assertEqual(self.item.recipe_snapshot[0]['ingredient_id'], str(self.beans.id))
        self.assertFalse(EventIngredient.objects.filter(event=self.event, ingredient=self.rice).exists())
        self.assertEqual(
            EventIngredient.objects.get(event=self.event, ingredient=self.beans).total_quantity,
            Decimal('0.5000'),
        )

    def test_locked_menu_rejects_update(self):
        self.event.menu_locked = True
        self.event.save(update_fields=['menu_locked'])

        response = self.client.patch(
            self.menu_item_url(),
            {'quantity': '20.00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, Decimal('10.00'))

    def test_locked_menu_rejects_delete(self):
        self.event.menu_locked = True
        self.event.save(update_fields=['menu_locked'])

        response = self.client.delete(self.menu_item_url())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.item.refresh_from_db()
        self.assertFalse(self.item.is_deleted)
